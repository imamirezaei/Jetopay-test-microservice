import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transfer } from '../entities/transfer.entity';
import { DestinationAccount } from '../entities/destination-account.entity';
import { TransferStatus } from '../enums/transfer-status.enum';
import { NotificationService } from './notification.service';

@Injectable()
export class TransferService {
  private readonly logger = new Logger(TransferService.name);

  constructor(
    @InjectRepository(Transfer)
    private transferRepository: Repository<Transfer>,
    @InjectRepository(DestinationAccount)
    private destinationAccountRepository: Repository<DestinationAccount>,
    private notificationService: NotificationService,
  ) {}

  async getTransferById(id: string): Promise<Transfer> {
    const transfer = await this.transferRepository.findOne({
      where: { id },
      relations: ['destinationAccount'],
    });

    if (!transfer) {
      throw new NotFoundException(`Transfer with ID ${id} not found`);
    }

    return transfer;
  }

  async createTransfer(data: {
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
    description: string;
    externalId?: string;
    referenceId?: string;
  }): Promise<Transfer> {
    this.logger.log(
      `Creating transfer from ${data.sourceAccountId} to ${data.destinationAccountId} for amount ${data.amount}`,
    );

    // Validate destination account
    const destinationAccount = await this.destinationAccountRepository.findOne({
      where: { id: data.destinationAccountId },
    });

    if (!destinationAccount) {
      throw new NotFoundException('Destination account not found');
    }

    // Create transfer record
    const transfer = this.transferRepository.create({
      sourceAccountId: data.sourceAccountId,
      destinationAccountId: data.destinationAccountId,
      amount: data.amount,
      description: data.description,
      externalId: data.externalId,
      referenceId: data.referenceId,
      status: TransferStatus.PENDING,
    });

    return this.transferRepository.save(transfer);
  }

  async processTransfer(transferId: string): Promise<{ status: TransferStatus; message?: string }> {
    const transfer = await this.getTransferById(transferId);

    if (transfer.status !== TransferStatus.PENDING) {
      return {
        status: transfer.status,
        message: 'Transfer has already been processed',
      };
    }

    try {
      this.logger.log(`Processing transfer ${transferId}`);

      // Update transfer status to PROCESSING
      transfer.status = TransferStatus.PROCESSING;
      await this.transferRepository.save(transfer);

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // In a real implementation, this would call the bank's API to process the transfer
      // For demo purposes, we'll just simulate the processing

      // Generate a simulated transaction ID
      const bankTransactionId = `BANK-TX-${Math.floor(Math.random() * 1000000)}`;
      transfer.bankTransactionId = bankTransactionId;

      // Update transfer status to COMPLETED
      transfer.status = TransferStatus.COMPLETED;
      transfer.completedAt = new Date();
      await this.transferRepository.save(transfer);

      // Send notification
      await this.notificationService.sendTransferNotification(
        transferId,
        `Transfer of ${transfer.amount} has been completed successfully`,
      );

      return {
        status: TransferStatus.COMPLETED,
        message: 'Transfer completed successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to process transfer ${transferId}: ${error.message}`, error.stack);

      // Update transfer status to FAILED
      transfer.status = TransferStatus.FAILED;
      transfer.failureReason = error.message;
      await this.transferRepository.save(transfer);

      return {
        status: TransferStatus.FAILED,
        message: error.message,
      };
    }
  }

  async getTransferStatus(transferId: string): Promise<{ status: TransferStatus; message?: string }> {
    const transfer = await this.getTransferById(transferId);

    return {
      status: transfer.status,
      message: transfer.failureReason,
    };
  }

  async updateTransferStatus(
    transferId: string,
    status: TransferStatus,
    reason?: string,
  ): Promise<Transfer> {
    const transfer = await this.getTransferById(transferId);

    transfer.status = status;
    
    if (status === TransferStatus.FAILED) {
      transfer.failureReason = reason;
    }
    
    if (status === TransferStatus.COMPLETED) {
      transfer.completedAt = new Date();
    }
    
    return this.transferRepository.save(transfer);
  }

  async getTransferHistory(
    destinationAccountId: string,
    limit: number = 10,
    offset: number = 0,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ transfers: Transfer[]; total: number }> {
    const whereClause: any = { destinationAccountId };
    
    if (startDate && endDate) {
      whereClause.createdAt = Between(startDate, endDate);
    } else if (startDate) {
      whereClause.createdAt = Between(startDate, new Date());
    } else if (endDate) {
      whereClause.createdAt = Between(new Date(0), endDate);
    }
    
    const [transfers, total] = await this.transferRepository.findAndCount({
      where: whereClause,
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });

    return { transfers, total };
  }

  async creditAccount(
    accountId: string,
    amount: number,
    description: string,
    transactionId: string,
    referenceId: string,
  ): Promise<{ success: boolean; message?: string; transferId?: string }> {
    try {
      // Get destination account
      const account = await this.destinationAccountRepository.findOne({
        where: { id: accountId },
      });
      
      if (!account) {
        throw new NotFoundException(`Account with ID ${accountId} not found`);
      }
      
      // Create a transfer record
      const transfer = await this.createTransfer({
        sourceAccountId: 'SYSTEM', // This is an incoming transfer, so source is marked as SYSTEM
        destinationAccountId: accountId,
        amount,
        description,
        externalId: transactionId,
        referenceId,
      });
      
      // Process the transfer
      const result = await this.processTransfer(transfer.id);
      
      if (result.status === TransferStatus.COMPLETED) {
        return {
          success: true,
          message: 'Account credited successfully',
          transferId: transfer.id,
        };
      } else {
        return {
          success: false,
          message: result.message || 'Failed to credit account',
          transferId: transfer.id,
        };
      }
    } catch (error) {
      this.logger.error(`Failed to credit account ${accountId}: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async getTransfersByStatus(status: TransferStatus): Promise<Transfer[]> {
    return this.transferRepository.find({
      where: { status },
      order: { createdAt: 'ASC' },
    });
  }

  async getRecentTransfers(accountId: string, count: number = 5): Promise<Transfer[]> {
    return this.transferRepository.find({
      where: { destinationAccountId: accountId },
      order: { createdAt: 'DESC' },
      take: count,
    });
  }

  async getTransferStatistics(
    accountId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any> {
    const whereClause: any = { destinationAccountId: accountId };
    
    if (startDate && endDate) {
      whereClause.createdAt = Between(startDate, endDate);
    } else if (startDate) {
      whereClause.createdAt = Between(startDate, new Date());
    } else if (endDate) {
      whereClause.createdAt = Between(new Date(0), endDate);
    }
    
    const transfers = await this.transferRepository.find({
      where: whereClause,
      select: ['amount', 'status', 'createdAt'],
    });
    
    const totalTransfers = transfers.length;
    const completedTransfers = transfers.filter(t => t.status === TransferStatus.COMPLETED).length;
    const totalAmount = transfers
      .filter(t => t.status === TransferStatus.COMPLETED)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Group by date
    const transfersByDate = {};
    transfers.forEach(transfer => {
      const date = transfer.createdAt.toISOString().split('T')[0];
      
      if (!transfersByDate[date]) {
        transfersByDate[date] = {
          date,
          count: 0,
          amount: 0,
        };
      }
      
      if (transfer.status === TransferStatus.COMPLETED) {
        transfersByDate[date].count++;
        transfersByDate[date].amount += Number(transfer.amount);
      }
    });
    
    return {
      totalTransfers,
      completedTransfers,
      totalAmount,
      successRate: totalTransfers > 0 ? (completedTransfers / totalTransfers) * 100 : 0,
      dailySummary: Object.values(transfersByDate),
    };
  }
}