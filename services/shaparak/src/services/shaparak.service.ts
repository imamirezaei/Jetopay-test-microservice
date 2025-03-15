import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CardPayment } from '../entities/card-payment.entity';
import { PaymentVerification } from '../entities/payment-verification.entity';
import { MerchantService } from './merchant.service';
import { CryptoService } from './crypto.service';
import { PaymentStatus } from '../enums/payment-status.enum';

@Injectable()
export class ShaparakService {
  private readonly logger = new Logger(ShaparakService.name);

  // Map of card BINs to bank information (simulated database)
  private readonly binDatabase = {
    '603799': { bank: 'Melli', country: 'IR', type: 'DEBIT' },
    '589210': { bank: 'Sepah', country: 'IR', type: 'DEBIT' },
    '627353': { bank: 'Tejarat', country: 'IR', type: 'DEBIT' },
    '627412': { bank: 'Eghtesad Novin', country: 'IR', type: 'CREDIT' },
    '622106': { bank: 'Parsian', country: 'IR', type: 'DEBIT' },
    '627760': { bank: 'Post Bank', country: 'IR', type: 'DEBIT' },
    '621986': { bank: 'Saman', country: 'IR', type: 'VIRTUAL' },
  };

  constructor(
    @InjectRepository(CardPayment)
    private cardPaymentRepository: Repository<CardPayment>,
    @InjectRepository(PaymentVerification)
    private paymentVerificationRepository: Repository<PaymentVerification>,
    @Inject('SHETAB_SERVICE') private shetabClient: ClientProxy,
    @Inject('HUB_SHAPARAK_SERVICE') private hubShaparakClient: ClientProxy,
    private merchantService: MerchantService,
    private cryptoService: CryptoService,
  ) {}

  async getTransactionHistory(
    merchantId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
    offset: number = 0,
  ): Promise<{ transactions: any[]; total: number }> {
    const whereClause: any = { merchantId };
    
    if (startDate && endDate) {
      whereClause.createdAt = Between(startDate, endDate);
    } else if (startDate) {
      whereClause.createdAt = Between(startDate, new Date());
    } else if (endDate) {
      whereClause.createdAt = Between(new Date(0), endDate);
    }
    
    const [payments, total] = await this.cardPaymentRepository.findAndCount({
      where: whereClause,
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });

    // Map payments to transaction history format
    const transactions = payments.map(payment => ({
      transactionId: payment.transactionId,
      referenceId: payment.referenceId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      statusMessage: payment.statusMessage,
      paymentMethod: payment.paymentMethod,
      completedAt: payment.completedAt,
      createdAt: payment.createdAt,
      // Don't include sensitive card info
    }));

    return { transactions, total };
  }

  async checkCardValidity(
    cardNumber: string,
    expiryMonth: string,
    expiryYear: string,
  ): Promise<{ valid: boolean; message?: string }> {
    this.logger.log(`Checking card validity: ${cardNumber.substring(0, 6)}******`);

    // Basic validation
    if (!cardNumber || cardNumber.length < 16) {
      return { valid: false, message: 'Invalid card number length' };
    }

    // Luhn algorithm check (standard credit card validation)
    if (!this.validateCardLuhn(cardNumber)) {
      return { valid: false, message: 'Invalid card number (failed Luhn check)' };
    }

    // Check if card BIN (first 6 digits) is in our database
    const cardBin = cardNumber.substring(0, 6);
    const binInfo = this.binDatabase[cardBin];

    if (!binInfo) {
      return { valid: false, message: 'Unknown card BIN' };
    }

    // Expiry date validation
    const now = new Date();
    const currentYear = now.getFullYear() % 100; // Last two digits
    const currentMonth = now.getMonth() + 1; // 1-12

    const expYear = parseInt(expiryYear, 10);
    const expMonth = parseInt(expiryMonth, 10);

    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      return { valid: false, message: 'Card has expired' };
    }

    // In a real implementation, additional checks would be performed with the bank
    // For demo, we'll just validate based on local data

    return {
      valid: true,
      message: 'Card is valid',
    };
  }

  async cardBinLookup(cardBin: string): Promise<any> {
    this.logger.log(`Looking up card BIN: ${cardBin}`);

    // Check if card BIN is in our database
    const binInfo = this.binDatabase[cardBin];

    if (!binInfo) {
      return {
        found: false,
        message: 'Unknown card BIN',
      };
    }

    // In a real implementation, this would query Shaparak's BIN database
    // For demo, we'll use our mock database

    return {
      found: true,
      bin: cardBin,
      bank: binInfo.bank,
      country: binInfo.country,
      type: binInfo.type,
    };
  }

  async getTransactionStatistics(
    merchantId: string,
    period: 'day' | 'week' | 'month' = 'day',
  ): Promise<any> {
    const endDate = new Date();
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
    
    const payments = await this.cardPaymentRepository.find({
      where: {
        merchantId,
        createdAt: Between(startDate, endDate),
      },
    });
    
    // Calculate statistics
    const totalCount = payments.length;
    const successfulPayments = payments.filter(p => p.status === PaymentStatus.SUCCESSFUL);
    const failedPayments = payments.filter(p => p.status === PaymentStatus.FAILED);
    const cancelledPayments = payments.filter(p => p.status === PaymentStatus.CANCELLED);
    
    const totalAmount = successfulPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const successRate = totalCount > 0 ? (successfulPayments.length / totalCount) * 100 : 0;
    
    // Group by payment method
    const methodStats = payments.reduce((acc, p) => {
      const method = p.paymentMethod;
      if (!acc[method]) {
        acc[method] = {
          count: 0,
          successCount: 0,
          amount: 0,
        };
      }
      
      acc[method].count++;
      
      if (p.status === PaymentStatus.SUCCESSFUL) {
        acc[method].successCount++;
        acc[method].amount += Number(p.amount);
      }
      
      return acc;
    }, {});
    
    // Group by day for chart data
    const dailyStats = {};
    payments.forEach(p => {
      const day = p.createdAt.toISOString().split('T')[0];
      
      if (!dailyStats[day]) {
        dailyStats[day] = {
          date: day,
          count: 0,
          successCount: 0,
          amount: 0,
        };
      }
      
      dailyStats[day].count++;
      
      if (p.status === PaymentStatus.SUCCESSFUL) {
        dailyStats[day].successCount++;
        dailyStats[day].amount += Number(p.amount);
      }
    });
    
    return {
      period,
      timeframe: {
        start: startDate,
        end: endDate,
      },
      totalCount,
      successfulCount: successfulPayments.length,
      failedCount: failedPayments.length,
      cancelledCount: cancelledPayments.length,
      totalAmount,
      successRate,
      methodStats,
      dailyStats: Object.values(dailyStats),
    };
  }

  // Helper methods

  private validateCardLuhn(cardNumber: string): boolean {
    // Remove any non-digit characters
    const digits = cardNumber.replace(/\D/g, '');
    
    let sum = 0;
    let shouldDouble = false;
    
    // Loop through digits in reverse order
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits.charAt(i), 10);
      
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    
    return sum % 10 === 0;
  }
}