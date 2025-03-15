import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AccountService } from '../services/account.service';
import { BalanceService } from '../services/balance.service';
import { TransactionService } from '../services/transaction.service';
import { TransactionType } from '../enums/transaction-type.enum';

@Controller()
export class MessageController {
  constructor(
    private readonly accountService: AccountService,
    private readonly balanceService: BalanceService,
    private readonly transactionService: TransactionService,
  ) {}

  @MessagePattern('get_account_info')
  async getAccountInfo(@Payload() data: { userId: string }) {
    return this.accountService.getAccountsByUserId(data.userId);
  }

  @MessagePattern('get_account_balance')
  async getAccountBalance(@Payload() data: { accountId: string }) {
    return this.balanceService.getAccountBalance(data.accountId);
  }

  @MessagePattern('get_transaction_history')
  async getTransactionHistory(
    @Payload() data: { accountId: string; limit?: number; offset?: number },
  ) {
    return this.transactionService.getTransactionHistory(
      data.accountId,
      data.limit || 10,
      data.offset || 0,
    );
  }

  @MessagePattern('debit_account')
  async debitAccount(
    @Payload() data: {
      accountId: string;
      amount: number;
      description: string;
      transactionId: string;
      referenceId: string;
    },
  ) {
    return this.transactionService.createTransaction({
      accountId: data.accountId,
      amount: data.amount,
      type: TransactionType.DEBIT,
      description: data.description,
      externalId: data.transactionId,
      referenceId: data.referenceId,
    });
  }
  
  @MessagePattern('check_funds_availability')
  async checkFundsAvailability(
    @Payload() data: { accountId: string; amount: number },
  ) {
    return this.balanceService.checkFundsAvailability(data.accountId, data.amount);
  }

  @MessagePattern('freeze_funds')
  async freezeFunds(
    @Payload() data: {
      accountId: string;
      amount: number;
      transactionId: string;
      expiration?: Date;
    },
  ) {
    return this.balanceService.freezeFunds(
      data.accountId,
      data.amount,
      data.transactionId,
      data.expiration,
    );
  }

  @MessagePattern('unfreeze_funds')
  async unfreezeFunds(
    @Payload() data: { accountId: string; transactionId: string },
  ) {
    return this.balanceService.unfreezeFunds(data.accountId, data.transactionId);
  }

  @MessagePattern('settle_transaction')
  async settleTransaction(
    @Payload() data: {
      transactionId: string;
      referenceId: string;
      amount: number;
    },
  ) {
    // This would involve confirming a previously initiated transaction
    const transaction = await this.transactionService.findByExternalId(data.transactionId);
    
    if (!transaction) {
      return {
        success: false,
        message: 'Transaction not found',
      };
    }
    
    // Update the transaction status
    await this.transactionService.updateTransaction(transaction.id, {
      status: 'SETTLED',
      referenceId: data.referenceId,
    });
    
    // For transactions with frozen funds, release them
    if (transaction.hasFrozenFunds) {
      await this.balanceService.unfreezeFunds(transaction.accountId, data.transactionId);
    }
    
    return {
      success: true,
      message: 'Transaction settled successfully',
    };
  }
  
  @MessagePattern('link_account')
  async linkAccount(
    @Payload() data: {
      userId: string;
      accountNumber: string;
      bankCode: string;
      cardNumber?: string;
    },
  ) {
    return this.accountService.linkAccount(
      data.userId,
      data.accountNumber,
      data.bankCode,
      data.cardNumber,
    );
  }
  
  @MessagePattern('verify_account_ownership')
  async verifyAccountOwnership(
    @Payload() data: {
      userId: string;
      accountId: string;
    },
  ) {
    return this.accountService.verifyAccountOwnership(data.userId, data.accountId);
  }
  
  @MessagePattern('get_account_details')
  async getAccountDetails(@Payload() data: { accountId: string }) {
    return this.accountService.getAccountDetails(data.accountId);
  }
}