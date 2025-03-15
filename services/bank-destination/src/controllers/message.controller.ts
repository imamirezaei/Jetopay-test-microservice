import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DestinationAccountService } from '../services/destination-account.service';
import { TransferService } from '../services/transfer.service';
import { NotificationService } from '../services/notification.service';
import { TransferStatus } from '../enums/transfer-status.enum';

@Controller()
export class MessageController {
  constructor(
    private readonly destinationAccountService: DestinationAccountService,
    private readonly transferService: TransferService,
    private readonly notificationService: NotificationService,
  ) {}

  @MessagePattern('receive_transfer')
  async receiveTransfer(
    @Payload() data: {
      transactionId: string;
      sourceAccountId: string;
      destinationAccountId: string;
      amount: number;
      description: string;
      referenceId: string;
    },
  ) {
    // Create a transfer record
    const transfer = await this.transferService.createTransfer({
      sourceAccountId: data.sourceAccountId,
      destinationAccountId: data.destinationAccountId,
      amount: data.amount,
      description: data.description,
      externalId: data.transactionId,
      referenceId: data.referenceId,
    });

    try {
      // Process the transfer
      const result = await this.transferService.processTransfer(transfer.id);

      // Send notification if successful
      if (result.status === TransferStatus.COMPLETED) {
        await this.notificationService.sendTransferNotification(
          transfer.id,
          'Transfer received successfully',
        );
      }

      return result;
    } catch (error) {
      // Update transfer status to failed
      await this.transferService.updateTransferStatus(
        transfer.id,
        TransferStatus.FAILED,
        error.message,
      );

      return {
        status: TransferStatus.FAILED,
        message: error.message,
      };
    }
  }

  @MessagePattern('validate_destination_account')
  async validateDestinationAccount(
    @Payload() data: {
      accountNumber: string;
      bankCode: string;
    },
  ) {
    return this.destinationAccountService.validateAccount(
      data.accountNumber,
      data.bankCode,
    );
  }

  @MessagePattern('get_transfer_status')
  async getTransferStatus(
    @Payload() data: { transferId: string },
  ) {
    return this.transferService.getTransferStatus(data.transferId);
  }

  @MessagePattern('verify_account_exists')
  async verifyAccountExists(
    @Payload() data: {
      accountNumber: string;
      bankCode: string;
    },
  ) {
    const account = await this.destinationAccountService.findAccount(
      data.accountNumber,
      data.bankCode,
    );

    return {
      exists: !!account,
      accountId: account?.id,
    };
  }

  @MessagePattern('credit_account')
  async creditAccount(
    @Payload() data: {
      accountId: string;
      amount: number;
      description: string;
      transactionId: string;
      referenceId: string;
    },
  ) {
    return this.transferService.creditAccount(
      data.accountId,
      data.amount,
      data.description,
      data.transactionId,
      data.referenceId,
    );
  }

  @MessagePattern('get_account_info')
  async getAccountInfo(
    @Payload() data: { accountId: string },
  ) {
    return this.destinationAccountService.getAccountInfo(data.accountId);
  }

  @MessagePattern('get_account_name')
  async getAccountName(
    @Payload() data: {
      accountNumber: string;
      bankCode: string;
    },
  ) {
    const account = await this.destinationAccountService.findAccount(
      data.accountNumber,
      data.bankCode,
    );

    return {
      accountName: account?.accountName || null,
      exists: !!account,
    };
  }
}