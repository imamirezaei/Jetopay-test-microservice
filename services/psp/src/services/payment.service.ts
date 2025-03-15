import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { Transaction } from '../entities/transaction.entity';
import { PaymentAttempt } from '../entities/payment-attempt.entity';
import { FraudDetectionService } from './fraud-detection.service';
import { TransactionService } from './transaction.service';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { PaymentMethodType } from '../enums/payment-method-type.enum';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(PaymentAttempt)
    private paymentAttemptRepository: Repository<PaymentAttempt>,
    private fraudDetectionService: FraudDetectionService,
    private transactionService: TransactionService,
    @Inject('SHAPARAK_SERVICE') private shaparakClient: ClientProxy,
    @Inject('SHETAB_SERVICE') private shetabClient: ClientProxy,
    @Inject('HUB_SHAPARAK_SERVICE') private hubShaparakClient: ClientProxy,
  ) {}

  async processPayment(paymentData: {
    transactionId: string;
    userId: string;
    amount: number;
    currency: string;
    paymentMethod: {
      type: PaymentMethodType;
      cardNumber?: string;
      token?: string;
    };
    merchantId: string;
    description: string;
    callbackUrl: string;
  }) {
    this.logger.log(`Processing payment for transaction: ${paymentData.transactionId}`);

    // Check for fraud
    const fraudCheck = await this.fraudDetectionService.checkFraud({
      userId: paymentData.userId,
      amount: paymentData.amount,
      merchantId: paymentData.merchantId,
      paymentMethod: paymentData.paymentMethod,
    });

    if (fraudCheck.isFraudulent) {
      this.logger.warn(`Fraud detected for transaction: ${paymentData.transactionId}`);
      throw new BadRequestException(`Payment rejected: ${fraudCheck.reason}`);
    }

    // Create payment attempt record
    const paymentAttempt = await this.paymentAttemptRepository.save({
      transactionId: paymentData.transactionId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      status: TransactionStatus.PROCESSING,
      metadata: {
        paymentMethod: paymentData.paymentMethod.type,
        merchantId: paymentData.merchantId,
      }
    });

    try {
      // For card payments, go through Shaparak
      if (paymentData.paymentMethod.type === PaymentMethodType.CARD) {
        const shaparakResponse = await firstValueFrom(
          this.shaparakClient.send('initiate_card_payment', {
            transactionId: paymentData.transactionId,
            amount: paymentData.amount,
            currency: paymentData.currency,
            cardInfo: paymentData.paymentMethod,
            merchantId: paymentData.merchantId,
            callbackUrl: paymentData.callbackUrl,
          })
        );

        if (shaparakResponse.success) {
          await this.transactionService.updateTransaction(paymentData.transactionId, {
            status: TransactionStatus.PENDING_AUTHORIZATION,
            gatewayReferenceId: shaparakResponse.referenceId,
          });

          return {
            success: true,
            referenceId: shaparakResponse.referenceId,
            gatewayUrl: shaparakResponse.gatewayUrl,
          };
        } else {
          throw new Error(shaparakResponse.message || 'Card payment initiation failed');
        }
      } 
      // For direct bank transfers, go through Shetab
      else if (paymentData.paymentMethod.type === PaymentMethodType.BANK_ACCOUNT) {
        const shetabResponse = await firstValueFrom(
          this.shetabClient.send('initiate_bank_transfer', {
            transactionId: paymentData.transactionId,
            amount: paymentData.amount,
            currency: paymentData.currency,
            bankAccount: paymentData.paymentMethod,
            merchantId: paymentData.merchantId,
          })
        );

        if (shetabResponse.success) {
          await this.transactionService.updateTransaction(paymentData.transactionId, {
            status: TransactionStatus.PROCESSING,
            gatewayReferenceId: shetabResponse.referenceId,
          });

          return {
            success: true,
            referenceId: shetabResponse.referenceId,
            transferInitiated: true,
          };
        } else {
          throw new Error(shetabResponse.message || 'Bank transfer initiation failed');
        }
      } else {
        throw new BadRequestException('Unsupported payment method');
      }
    } catch (error) {
      this.logger.error(`Payment processing failed: ${error.message}`, error.stack);
      
      // Update payment attempt status
      await this.paymentAttemptRepository.update(paymentAttempt.id, {
        status: TransactionStatus.FAILED,
        errorDetails: error.message,
      });
      
      // Update transaction status
      await this.transactionService.updateTransaction(paymentData.transactionId, {
        status: TransactionStatus.FAILED,
        statusDetails: error.message,
      });
      
      return {
        success: false,
        message: error.message || 'Payment processing failed',
      };
    }
  }

  async verifyPayment(transactionId: string, referenceId: string, amount: number) {
    this.logger.log(`Verifying payment for transaction: ${transactionId}, reference: ${referenceId}`);
    
    try {
      // Get transaction details
      const transaction = await this.transactionRepository.findOne({
        where: { id: transactionId }
      });
      
      if (!transaction) {
        throw new BadRequestException(`Transaction not found: ${transactionId}`);
      }
      
      // Verify with Shaparak
      const verificationResponse = await firstValueFrom(
        this.shaparakClient.send('verify_payment', {
          transactionId,
          referenceId,
          amount,
        })
      );
      
      if (verificationResponse.verified) {
        // Record transaction in Hub Shaparak
        await firstValueFrom(
          this.hubShaparakClient.send('record_transaction', {
            transactionId,
            referenceId,
            amount,
            status: TransactionStatus.SUCCESSFUL,
          })
        );
        
        // Update transaction status
        await this.transactionService.updateTransaction(transactionId, {
          status: TransactionStatus.SUCCESSFUL,
          statusDetails: 'Payment verified successfully',
        });
        
        return {
          verified: true,
          referenceId,
          message: 'Payment verification successful',
        };
      } else {
        throw new Error(verificationResponse.message || 'Payment verification failed');
      }
    } catch (error) {
      this.logger.error(`Payment verification failed: ${error.message}`, error.stack);
      
      // Update transaction status
      await this.transactionService.updateTransaction(transactionId, {
        status: TransactionStatus.FAILED,
        statusDetails: error.message,
      });
      
      return {
        verified: false,
        message: error.message || 'Payment verification failed',
      };
    }
  }

  async checkTransactionStatus(transactionId: string) {
    try {
      const transaction = await this.transactionRepository.findOne({
        where: { id: transactionId }
      });
      
      if (!transaction) {
        throw new BadRequestException(`Transaction not found: ${transactionId}`);
      }
      
      return {
        transactionId,
        status: transaction.status,
        statusDetails: transaction.statusDetails,
        lastUpdated: transaction.updatedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to check transaction status: ${error.message}`, error.stack);
      throw error;
    }
  }

  async cancelTransaction(transactionId: string, reason: string) {
    try {
      const transaction = await this.transactionRepository.findOne({
        where: { id: transactionId }
      });
      
      if (!transaction) {
        throw new BadRequestException(`Transaction not found: ${transactionId}`);
      }
      
      if (transaction.status === TransactionStatus.SUCCESSFUL) {
        throw new BadRequestException('Cannot cancel a successful transaction');
      }
      
      if (transaction.status === TransactionStatus.CANCELLED) {
        return {
          success: true,
          message: 'Transaction was already cancelled',
        };
      }
      
      // Cancel the transaction
      await this.transactionService.updateTransaction(transactionId, {
        status: TransactionStatus.CANCELLED,
        statusDetails: `Cancelled: ${reason}`,
      });
      
      // Notify Hub Shaparak
      await firstValueFrom(
        this.hubShaparakClient.send('update_transaction', {
          transactionId,
          status: TransactionStatus.CANCELLED,
          reason,
        })
      );
      
      return {
        success: true,
        message: 'Transaction cancelled successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to cancel transaction: ${error.message}`, error.stack);
      throw error;
    }
  }
}