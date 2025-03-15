// payment/services/payment.service.ts
import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { TransactionService } from './transaction.service';
import { PaymentProcessorService } from './payment-processor.service';
import { PaymentMethodService } from './payment-method.service';
import { InitiatePaymentDto } from '../dto/initiate-payment.dto';
import { VerifyPaymentDto } from '../dto/verify-payment.dto';
import { TransactionResponseDto } from '../dto/transaction-response.dto';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { TransactionType } from '../enums/transaction-type.enum';
import { PaymentMethod } from '../entities/payment-method.entity';

@Injectable()
export class PaymentService {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly paymentProcessorService: PaymentProcessorService,
    private readonly paymentMethodService: PaymentMethodService,
    @Inject('PSP_SERVICE') private pspClient: ClientProxy,
    @Inject('BANK_SOURCE_SERVICE') private bankSourceClient: ClientProxy,
    @Inject('SHAPARAK_SERVICE') private shaparakClient: ClientProxy,
  ) {}

  async initiatePayment(
    userId: string,
    initiatePaymentDto: InitiatePaymentDto,
  ): Promise<TransactionResponseDto> {
    // Get the payment method if specified, otherwise use the default
    let paymentMethod: PaymentMethod;
    
    if (initiatePaymentDto.paymentMethodId) {
      paymentMethod = await this.paymentMethodService.findById(
        initiatePaymentDto.paymentMethodId,
      );
      
      if (!paymentMethod || paymentMethod.userId !== userId) {
        throw new NotFoundException('Payment method not found');
      }
    } else {
      paymentMethod = await this.paymentMethodService.getDefaultPaymentMethod(userId);
      
      if (!paymentMethod) {
        throw new BadRequestException('No default payment method found');
      }
    }

    // Create a transaction record
    const transaction = await this.transactionService.createTransaction({
      userId,
      amount: initiatePaymentDto.amount,
      currency: initiatePaymentDto.currency || 'IRR',
      description: initiatePaymentDto.description,
      merchantId: initiatePaymentDto.merchantId,
      paymentMethodId: paymentMethod.id,
      type: TransactionType.PAYMENT,
      metadata: initiatePaymentDto.metadata,
      status: TransactionStatus.PENDING,
    });

    try {
      // Process the payment through PSP service
      const pspResponse = await firstValueFrom(
        this.pspClient.send('process_payment', {
          transactionId: transaction.id,
          userId,
          amount: initiatePaymentDto.amount,
          currency: initiatePaymentDto.currency || 'IRR',
          paymentMethod: {
            type: paymentMethod.type,
            cardNumber: paymentMethod.maskedCardNumber,
            token: paymentMethod.token,
          },
          merchantId: initiatePaymentDto.merchantId,
          description: initiatePaymentDto.description,
          callbackUrl: initiatePaymentDto.callbackUrl,
        }),
      );

      // Update the transaction with PSP response data
      return this.transactionService.updateTransaction(transaction.id, {
        referenceId: pspResponse.referenceId,
        gatewayUrl: pspResponse.gatewayUrl,
        status: TransactionStatus.PROCESSING,
        statusDetail: 'Payment is being processed',
      });
    } catch (error) {
      // Update the transaction as failed
      await this.transactionService.updateTransactionStatus(
        transaction.id,
        TransactionStatus.FAILED,
        error.message || 'Failed to process payment',
      );
      
      throw new BadRequestException('Payment processing failed: ' + (error.message || 'Unknown error'));
    }
  }

  async verifyPayment(
    userId: string,
    verifyPaymentDto: VerifyPaymentDto,
  ): Promise<TransactionResponseDto> {
    // Find the transaction
    const transaction = await this.transactionService.findByReferenceId(
      verifyPaymentDto.referenceId,
    );

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.userId !== userId) {
      throw new BadRequestException('You do not have permission to verify this transaction');
    }

    if (transaction.status === TransactionStatus.SUCCESSFUL) {
      return transaction;
    }

    if (
      transaction.status === TransactionStatus.FAILED ||
      transaction.status === TransactionStatus.CANCELLED
    ) {
      throw new BadRequestException(`Transaction was already ${transaction.status.toLowerCase()}`);
    }

    try {
      // Verify the payment through Shaparak service
      const verificationResult = await firstValueFrom(
        this.shaparakClient.send('verify_payment', {
          transactionId: transaction.id,
          referenceId: verifyPaymentDto.referenceId,
          amount: transaction.amount,
          additionalData: verifyPaymentDto.additionalData,
        }),
      );

      if (verificationResult.verified) {
        // Settlement through bank service
        await firstValueFrom(
          this.bankSourceClient.send('settle_transaction', {
            transactionId: transaction.id,
            referenceId: verifyPaymentDto.referenceId,
            amount: transaction.amount,
          }),
        );

        // Update the transaction as successful
        return this.transactionService.updateTransactionStatus(
          transaction.id,
          TransactionStatus.SUCCESSFUL,
          'Payment verified and settled successfully',
        );
      } else {
        // Update the transaction as failed
        return this.transactionService.updateTransactionStatus(
          transaction.id,
          TransactionStatus.FAILED,
          verificationResult.message || 'Payment verification failed',
        );
      }
    } catch (error) {
      // Update the transaction as failed
      await this.transactionService.updateTransactionStatus(
        transaction.id,
        TransactionStatus.FAILED,
        error.message || 'Failed to verify payment',
      );
      
      throw new BadRequestException('Payment verification failed: ' + (error.message || 'Unknown error'));
    }
  }
}
