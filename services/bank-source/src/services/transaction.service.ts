import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AccountTransaction } from '../entities/account-transaction.entity';
import { BalanceService } from './balance.service';
import { TransactionType } from '../enums/transaction-type.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectRepository(AccountTransaction)
    private accountTransactionRepository: Repository<AccountTransaction>,
    private balanceService: BalanceService,
  ) {}

  async getTransactionById(id: string): Promise<AccountTransaction> {
    const transaction = await this.accountTransactionRepository.findOne({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async findByExternalId(externalId: string): Promise<AccountTransaction> {
    return this.accountTransactionRepository.findOne({
      where: { externalId },
    });
  }

  async getTransactionHistory(
    accountId: string,
    limit: number = 10,
    offset: number = 0,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ transactions: AccountTransaction[]; total: number }> {
    const whereClause: any = { accountId };
    
    if (startDate && endDate) {
      whereClause.createdAt = Between(startDate, endDate);
    } else if (startDate) {
      whereClause.createdAt = Between(startDate, new Date());
    } else if (endDate) {
      whereClause.createdAt = Between(new Date(0), endDate);
    }
    
    const [transactions, total] = await this.accountTransactionRepository.findAndCount({
      where: whereClause,
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });

    return { transactions, total };
  }

  async createTransaction(data: {
    accountId: string;
    amount: number;
    type: TransactionType;
    description: string;
    externalId?: string;
    referenceId?: string;
  }): Promise<AccountTransaction> {
    this.logger.log(`Creating ${data.type} transaction for account ${data.accountId}`);

    // Create transaction record
    const transaction = this.accountTransactionRepository.create({
      accountId: data.accountId,
      amount: data.amount,
      type: data.type,
      description: data.description,
      externalId: data.externalId,
      referenceId: data.referenceId,
      status: TransactionStatus.PENDING,
    });

    const savedTransaction = await this.accountTransactionRepository.save(transaction);

    try {
      // Update account balance based on transaction type
      if (data.type === TransactionType.DEBIT) {
        await this.balanceService.debitAccount(
          data.accountId,
          data.amount,
          savedTransaction.id,
        );
      } else if (data.type === TransactionType.CREDIT) {
        await this.balanceService.creditAccount(
          data.accountId,
          data.amount,
        );
      }

      // Update transaction status
      savedTransaction.status = TransactionStatus.COMPLETED;
      await this.accountTransactionRepository.save(savedTransaction);

      return savedTransaction;
    } catch (error) {
      // Update transaction status to failed
      savedTransaction.status = TransactionStatus.FAILED;
      savedTransaction.failureReason = error.message;
      await this.accountTransactionRepository.save(savedTransaction);

      throw error;
    }
  }

  async updateTransaction(
    id: string,
    updateData: Partial<AccountTransaction>,
  ): Promise<AccountTransaction> {
    const transaction = await this.getTransactionById(id);
    
    Object.assign(transaction, updateData);
    
    return this.accountTransactionRepository.save(transaction);
  }

  async getTransactionsByStatus(status: TransactionStatus): Promise<AccountTransaction[]> {
    return this.accountTransactionRepository.find({
      where: { status },
      order: { createdAt: 'ASC' },
    });
  }

  async getRecentTransactions(
    accountId: string,
    count: number = 5,
  ): Promise<AccountTransaction[]> {
    return this.accountTransactionRepository.find({
      where: { accountId },
      order: { createdAt: 'DESC' },
      take: count,
    });
  }
  
  async getTotalDebitsAndCredits(
    accountId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ totalDebits: number; totalCredits: number }> {
    const whereClauseDebit: any = { 
      accountId, 
      type: TransactionType.DEBIT,
      status: TransactionStatus.COMPLETED 
    };
    
    const whereClauseCredit: any = { 
      accountId, 
      type: TransactionType.CREDIT,
      status: TransactionStatus.COMPLETED 
    };
    
    if (startDate && endDate) {
      whereClauseDebit.createdAt = Between(startDate, endDate);
      whereClauseCredit.createdAt = Between(startDate, endDate);
    } else if (startDate) {
      whereClauseDebit.createdAt = Between(startDate, new Date());
      whereClauseCredit.createdAt = Between(startDate, new Date());
    } else if (endDate) {
      whereClauseDebit.createdAt = Between(new Date(0), endDate);
      whereClauseCredit.createdAt = Between(new Date(0), endDate);
    }
    
    const debits = await this.accountTransactionRepository.find({
      where: whereClauseDebit,
      select: ['amount'],
    });
    
    const credits = await this.accountTransactionRepository.find({
      where: whereClauseCredit,
      select: ['amount'],
    });
    
    const totalDebits = debits.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const totalCredits = credits.reduce((sum, tx) => sum + Number(tx.amount), 0);
    
    return { totalDebits, totalCredits };
  }
  
  async getTransactionSummary(
    accountId: string,
    period: 'day' | 'week' | 'month' = 'month',
  ): Promise<any> {
    const startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }
    
    const { totalDebits, totalCredits } = await this.getTotalDebitsAndCredits(
      accountId,
      startDate,
    );
    
    const transactions = await this.accountTransactionRepository.find({
      where: {
        accountId,
        createdAt: Between(startDate, new Date()),
      },
      order: { createdAt: 'DESC' },
    });
    
    // Group transactions by day
    const transactionsByDay = transactions.reduce((acc, tx) => {
      const date = tx.createdAt.toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = {
          date,
          debits: 0,
          credits: 0,
          transactions: [],
        };
      }
      
      if (tx.type === TransactionType.DEBIT) {
        acc[date].debits += Number(tx.amount);
      } else if (tx.type === TransactionType.CREDIT) {
        acc[date].credits += Number(tx.amount);
      }
      
      acc[date].transactions.push(tx);
      
      return acc;
    }, {});
    
    return {
      period,
      startDate,
      endDate: new Date(),
      totalDebits,
      totalCredits,
      netFlow: totalCredits - totalDebits,
      dailySummary: Object.values(transactionsByDay),
    };
  }
}