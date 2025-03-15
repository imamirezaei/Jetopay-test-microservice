// payment/services/transaction.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { TransactionType } from '../enums/transaction-type.enum';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';
import { TransactionResponseDto } from '../dto/transaction-response.dto';
import { PaymentFilterDto } from '../dto/payment-filter.dto';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async createTransaction(
    createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const transaction = this.transactionRepository.create({
      ...createTransactionDto,
      date: new Date(),
    });

    const savedTransaction = await this.transactionRepository.save(transaction);
    return this.mapToResponseDto(savedTransaction);
  }

  async getTransactionById(id: string): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['paymentMethod'],
    });

    if (!transaction) {
      return null;
    }

    return this.mapToResponseDto(transaction);
  }

  async findByReferenceId(referenceId: string): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { referenceId },
      relations: ['paymentMethod'],
    });

    if (!transaction) {
      return null;
    }

    return this.mapToResponseDto(transaction);
  }

  async updateTransaction(
    id: string,
    updateTransactionDto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    await this.transactionRepository.update(id, updateTransactionDto);
    
    return this.getTransactionById(id);
  }

  async updateTransactionStatus(
    id: string,
    status: TransactionStatus,
    statusDetail?: string,
  ): Promise<TransactionResponseDto> {
    await this.transactionRepository.update(id, {
      status,
      statusDetail,
      updatedAt: new Date(),
    });
    
    return this.getTransactionById(id);
  }

  async getUserTransactions(
    userId: string,
    filterDto: PaymentFilterDto,
  ): Promise<{ transactions: TransactionResponseDto[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, status, type, startDate, endDate } = filterDto;
    
    // Build where conditions
    const where: FindOptionsWhere<Transaction> = { userId };
    
    if (status) {
      where.status = status;
    }
    
    if (type) {
      where.type = type;
    }
    
    if (startDate && endDate) {
      where.date = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.date = Between(new Date(startDate), new Date());
    } else if (endDate) {
      where.date = Between(new Date('1970-01-01'), new Date(endDate));
    }
    
    const [transactions, total] = await this.transactionRepository.findAndCount({
      where,
      relations: ['paymentMethod'],
      order: { date: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    
    return {
      transactions: transactions.map(this.mapToResponseDto),
      total,
      page,
      limit,
    };
  }

  async getPaymentSummary(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<any> {
    // Build where conditions
    const where: FindOptionsWhere<Transaction> = { userId };
    
    if (startDate && endDate) {
      where.date = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.date = Between(new Date(startDate), new Date());
    } else if (endDate) {
      where.date = Between(new Date('1970-01-01'), new Date(endDate));
    }
    
    // Get all transactions for the summary
    const transactions = await this.transactionRepository.find({
      where,
      select: ['id', 'amount', 'currency', 'date', 'status', 'type'],
    });
    
    // Calculate summary statistics
    const totalAmount = transactions.reduce(
      (sum, tx) => tx.status === TransactionStatus.SUCCESSFUL ? sum + tx.amount : sum,
      0,
    );
    
    const totalTransactions = transactions.length;
    
    const successfulTransactions = transactions.filter(
      tx => tx.status === TransactionStatus.SUCCESSFUL,
    ).length;
    
    const failedTransactions = transactions.filter(
      tx => tx.status === TransactionStatus.FAILED,
    ).length;
    
    // Group by transaction type
    const byType = transactions.reduce((acc, tx) => {
      acc[tx.type] = (acc[tx.type] || 0) + (tx.status === TransactionStatus.SUCCESSFUL ? tx.amount : 0);
      return acc;
    }, {});
    
    // Group by month (for chart data)
    const byMonth = {};
    transactions.forEach(tx => {
      const month = tx.date.toISOString().slice(0, 7); // YYYY-MM format
      if (!byMonth[month]) {
        byMonth[month] = 0;
      }
      if (tx.status === TransactionStatus.SUCCESSFUL) {
        byMonth[month] += tx.amount;
      }
    });
    
    return {
      totalAmount,
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      successRate: totalTransactions > 0 ? successfulTransactions / totalTransactions : 0,
      byType,
      byMonth: Object.entries(byMonth).map(([month, amount]) => ({ month, amount })),
    };
  }

  private mapToResponseDto(transaction: Transaction): TransactionResponseDto {
    return {
      id: transaction.id,
      userId: transaction.userId,
      amount: transaction.amount,
      currency: transaction.currency,
      description: transaction.description,
      merchantId: transaction.merchantId,
      referenceId: transaction.referenceId,
      gatewayUrl: transaction.gatewayUrl,
      paymentMethod: transaction.paymentMethod ? {
        id: transaction.paymentMethod.id,
        type: transaction.paymentMethod.type,
        maskedCardNumber: transaction.paymentMethod.maskedCardNumber,
        cardHolderName: transaction.paymentMethod.cardHolderName,
        expirationDate: transaction.paymentMethod.expirationDate,
        isDefault: transaction.paymentMethod.isDefault,
      } : null,
      type: transaction.type,
      status: transaction.status,
      statusDetail: transaction.statusDetail,
      metadata: transaction.metadata,
      date: transaction.date,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}