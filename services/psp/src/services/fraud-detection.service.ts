import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThanOrEqual } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { PaymentMethodType } from '../enums/payment-method-type.enum';

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  // Define fraud detection thresholds
  private readonly HIGH_AMOUNT_THRESHOLD = 100000000; // 100,000,000 IRR (about $2000)
  private readonly MAX_DAILY_TRANSACTION_COUNT = 20;
  private readonly MAX_DAILY_TRANSACTION_AMOUNT = 300000000; // 300,000,000 IRR (about $6000)
  private readonly UNUSUAL_LOCATION_THRESHOLD = 500; // km

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async checkFraud(data: {
    userId: string;
    amount: number;
    merchantId: string;
    paymentMethod: {
      type: PaymentMethodType;
      cardNumber?: string;
      token?: string;
    };
    ipAddress?: string;
    deviceId?: string;
    location?: { lat: number; lng: number };
  }): Promise<{ isFraudulent: boolean; reason?: string }> {
    this.logger.log(`Checking fraud for user ${data.userId}, amount: ${data.amount}`);

    // Check for high-value transactions
    if (data.amount > this.HIGH_AMOUNT_THRESHOLD) {
      this.logger.warn(`High amount transaction detected: ${data.amount}`);
      
      // For high value transactions, we don't automatically reject,
      // but flag them for additional verification
      // return { isFraudulent: true, reason: 'Amount exceeds threshold' };
    }

    // Check for velocity - too many transactions in a day
    const dailyTransactions = await this.getDailyTransactions(data.userId);
    
    if (dailyTransactions.length >= this.MAX_DAILY_TRANSACTION_COUNT) {
      this.logger.warn(`Too many transactions for user ${data.userId} in 24 hours: ${dailyTransactions.length}`);
      return { isFraudulent: true, reason: 'Transaction velocity exceeds daily limit' };
    }

    // Check for daily amount limit
    const dailyAmount = dailyTransactions.reduce(
      (sum, tx) => sum + Number(tx.amount), 
      0
    );
    
    if (dailyAmount + data.amount > this.MAX_DAILY_TRANSACTION_AMOUNT) {
      this.logger.warn(`Daily amount exceeded for user ${data.userId}: ${dailyAmount + data.amount}`);
      return { isFraudulent: true, reason: 'Daily transaction amount exceeded' };
    }

    // Check for unusual location
    if (data.location && data.deviceId) {
      const isUnusualLocation = await this.checkUnusualLocation(
        data.userId,
        data.deviceId,
        data.location
      );
      
      if (isUnusualLocation) {
        this.logger.warn(`Unusual location detected for user ${data.userId}`);
        return { isFraudulent: true, reason: 'Unusual transaction location' };
      }
    }

    // Check for suspicious merchant
    const isSuspiciousMerchant = await this.isSuspiciousMerchant(data.merchantId);
    if (isSuspiciousMerchant) {
      this.logger.warn(`Suspicious merchant detected: ${data.merchantId}`);
      return { isFraudulent: true, reason: 'Suspicious merchant' };
    }

    // Check for credit card BIN verification
    // This would typically call an external service with the card number BIN (first 6 digits)
    if (data.paymentMethod.type === PaymentMethodType.CARD && data.paymentMethod.cardNumber) {
      const isValidBin = this.validateCardBin(data.paymentMethod.cardNumber);
      if (!isValidBin) {
        this.logger.warn(`Invalid card BIN detected`);
        return { isFraudulent: true, reason: 'Invalid card BIN' };
      }
    }

    // Check for previously failed transactions
    const recentFailedTransactions = await this.getRecentFailedTransactions(data.userId);
    if (recentFailedTransactions.length >= 3) {
      this.logger.warn(`Multiple failed transactions detected for user ${data.userId}`);
      return { isFraudulent: true, reason: 'Multiple failed transactions' };
    }

    // No fraud detected
    return { isFraudulent: false };
  }

  private async getDailyTransactions(userId: string): Promise<Transaction[]> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return this.transactionRepository.find({
      where: {
        userId,
        createdAt: MoreThan(yesterday),
      },
    });
  }

  private async checkUnusualLocation(
    userId: string,
    deviceId: string,
    currentLocation: { lat: number; lng: number }
  ): Promise<boolean> {
    // In a real implementation, we would:
    // 1. Get the last known location for this user/device
    // 2. Calculate the distance between the two points
    // 3. Determine if the movement is physically possible in the time elapsed
    
    // For simplicity, we'll just return false (no unusual location detected)
    return false;
  }

  private async isSuspiciousMerchant(merchantId: string): Promise<boolean> {
    // In a real implementation, we would check against a database of known
    // suspicious merchants or use an external fraud detection service
    
    // For simplicity, we'll just return false
    return false;
  }

  private validateCardBin(cardNumber: string): boolean {
    // In a real implementation, we would validate the card BIN against
    // a database of valid card BINs or use an external service
    
    // For simplicity, we'll do a basic check that the card number is at least 16 digits
    const cardDigits = cardNumber.replace(/\s+/g, '');
    return cardDigits.length >= 16 && /^\d+$/.test(cardDigits);
  }

  private async getRecentFailedTransactions(userId: string): Promise<Transaction[]> {
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
    
    return this.transactionRepository.find({
      where: {
        userId,
        status: TransactionStatus.FAILED,
        createdAt: MoreThan(twoHoursAgo),
      },
    });
  }

  // Additional methods for more sophisticated fraud detection:
  
  async identifyFraudPatterns(): Promise<any> {
    // This would analyze transaction data to identify potential fraud patterns
    // using machine learning or statistical analysis
    
    // For demonstration purposes, we'll return some mock fraud patterns
    return {
      unusualVelocityUsers: ['user-123', 'user-456'],
      suspiciousLocations: ['city-789'],
      suspiciousMerchants: ['merchant-987'],
    };
  }

  async updateFraudRules(rules: any): Promise<void> {
    // In a real implementation, this would update the fraud detection rules
    // based on new patterns or administrator input
    
    this.logger.log(`Updating fraud rules: ${JSON.stringify(rules)}`);
    // Implementation details would depend on how rules are stored and applied
  }
}