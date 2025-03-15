import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { TransactionStatus } from '../enums/transaction-status.enum';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async getTransactionById(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['attempts'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async getTransactionByReferenceId(referenceId: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { gatewayReferenceId: referenceId },
      relations: ['attempts'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with reference ID ${referenceId} not found`);
    }

    return transaction;
  }

  async createTransaction(transactionData: Partial<Transaction>): Promise<Transaction> {
    const transaction = this.transactionRepository.create(transactionData);
    return this.transactionRepository.save(transaction);
  }

  async updateTransaction(
    id: string,
    updateData: Partial<Transaction>,
  ): Promise<Transaction> {
    const transaction = await this.getTransactionById(id);
    
    Object.assign(transaction, updateData);
    
    this.logger.log(`Updating transaction ${id} to status: ${updateData.status}`);
    
    return this.transactionRepository.save(transaction);
  }

  async getAllTransactionsByUserId(userId: string): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getTransactionsByStatus(status: TransactionStatus): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { status },
      order: { createdAt: 'DESC' },
    });
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: [
        { status: TransactionStatus.PENDING },
        { status: TransactionStatus.PROCESSING },
        { status: TransactionStatus.PENDING_AUTHORIZATION },
      ],
      order: { createdAt: 'ASC' },
    });
  }

  async getTransactionStatistics(timeframe: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<any> {
    // Calculate date range based on timeframe
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case 'daily':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }
    
    // Query all transactions in the given timeframe
    const transactions = await this.transactionRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });
    
    // Calculate statistics
    const totalCount = transactions.length;
    const successfulTransactions = transactions.filter(t => t.status === TransactionStatus.SUCCESSFUL);
    const failedTransactions = transactions.filter(t => t.status === TransactionStatus.FAILED);
    
    const totalAmount = successfulTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const successRate = totalCount > 0 ? (successfulTransactions.length / totalCount) * 100 : 0;
    
    // Group by payment method
    const paymentMethodStats = transactions.reduce((acc, t) => {
      const method = t.paymentMethodType;
      if (!acc[method]) {
        acc[method] = {
          count: 0,
          successCount: 0,
          amount: 0,
        };
      }
      
      acc[method].count++;
      
      if (t.status === TransactionStatus.SUCCESSFUL) {
        acc[method].successCount++;
        acc[method].amount += Number(t.amount);
      }
      
      return acc;
    }, {});
    
    return {
      timeframe,
      period: {
        start: startDate,
        end: endDate,
      },
      totalCount,
      successfulCount: successfulTransactions.length,
      failedCount: failedTransactions.length,
      totalAmount,
      successRate,
      paymentMethodStats,
    };
  }
  
  async getTransactionSummary(): Promise<any> {
    // Get counts for all transaction statuses
    const statusCounts = await Promise.all(
      Object.values(TransactionStatus).map(async status => {
        const count = await this.transactionRepository.count({
          where: { status },
        });
        return { status, count };
      })
    );
    
    // Get total successful amount
    const successfulTransactions = await this.transactionRepository.find({
      where: { status: TransactionStatus.SUCCESSFUL },
      select: ['amount'],
    });
    
    const totalSuccessfulAmount = successfulTransactions.reduce(
      (sum, t) => sum + Number(t.amount), 
      0
    );
    
    // Get recent transactions
    const recentTransactions = await this.transactionRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
    });
    
    return {
      statusCounts: statusCounts.reduce((acc, { status, count }) => {
        acc[status] = count;
        return acc;
      }, {}),
      totalTransactions: statusCounts.reduce((sum, { count }) => sum + count, 0),
      totalSuccessfulAmount,
      recentTransactions,
    };
  }
  
  async findUnresolvedTransactions(): Promise<Transaction[]> {
    // Find transactions in processing state for too long (over 30 minutes)
    const thirtyMinutesAgo = new Date();
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);
    
    return this.transactionRepository.find({
      where: [
        {
          status: TransactionStatus.PROCESSING,
          updatedAt: Between(new Date(0), thirtyMinutesAgo),
        },
        {
          status: TransactionStatus.PENDING_AUTHORIZATION,
          updatedAt: Between(new Date(0), thirtyMinutesAgo),
        },
      ],
    });
  }
}