import { Injectable, Logger, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CardPayment } from '../entities/card-payment.entity';
import { PaymentVerification } from '../entities/payment-verification.entity';
import { MerchantService } from './merchant.service';
import { CryptoService } from './crypto.service';
import { PaymentStatus } from '../enums/payment-status.enum';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CardPaymentService {
  private readonly logger = new Logger(CardPaymentService.name);

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

  async initiateCardPayment(
    transactionId: string,
    amount: number,
    currency: string,
    cardInfo: any,
    merchantId: string,
    callbackUrl: string,
  ): Promise<any> {
    this.logger.log(`Initiating card payment for transaction: ${transactionId}`);

    // Verify merchant
    const merchant = await this.merchantService.getMerchantInfo(merchantId);
    if (!merchant.active) {
      throw new BadRequestException('Merchant is not active');
    }

    // Create payment gateway reference ID
    // In real implementation, this would be from Shaparak
    const referenceId = this.generateReferenceId();

    // Create a payment record
    const payment = this.cardPaymentRepository.create({
      transactionId,
      referenceId,
      amount,
      currency,
      merchantId,
      callbackUrl,
      status: PaymentStatus.PENDING,
      paymentMethod: 'CARD',
      // Encrypt any sensitive card info
      cardInfo: cardInfo ? this.cryptoService.encrypt(JSON.stringify(cardInfo)) : null,
    });

    const savedPayment = await this.cardPaymentRepository.save(payment);

    // Prepare the gateway URL
    // In real implementation, this would be a URL to Shaparak's payment page
    const gatewayUrl = this.buildGatewayUrl(savedPayment, merchant);

    // Notify Hub Shaparak about the transaction
    try {
      await firstValueFrom(
        this.hubShaparakClient.send('record_transaction_start', {
          transactionId,
          referenceId,
          merchantId,
          amount,
          currency,
          timestamp: new Date(),
        })
      );
    } catch (error) {
      this.logger.error(`Failed to notify Hub Shaparak: ${error.message}`, error.stack);
      // Continue anyway, as this is just for record-keeping
    }

    return {
      success: true,
      referenceId,
      gatewayUrl,
    };
  }

  async processPaymentCallback(
    referenceId: string,
    status: string,
    transactionId: string,
    additionalData: any,
  ): Promise<{ success: boolean; message?: string }> {
    this.logger.log(`Processing payment callback for reference: ${referenceId}, status: ${status}`);

    // Find the payment
    const payment = await this.cardPaymentRepository.findOne({
      where: { referenceId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with reference ID ${referenceId} not found`);
    }

    // Verify transaction ID matches
    if (payment.transactionId !== transactionId) {
      throw new BadRequestException('Transaction ID mismatch');
    }

    // Update payment status based on callback status
    let paymentStatus: PaymentStatus;
    let statusMessage: string;

    switch (status.toUpperCase()) {
      case 'SUCCESS':
        paymentStatus = PaymentStatus.SUCCESSFUL;
        statusMessage = 'Payment completed successfully';
        break;
      case 'FAILED':
        paymentStatus = PaymentStatus.FAILED;
        statusMessage = additionalData?.message || 'Payment failed';
        break;
      case 'CANCELLED':
        paymentStatus = PaymentStatus.CANCELLED;
        statusMessage = 'Payment was cancelled';
        break;
      default:
        paymentStatus = PaymentStatus.UNKNOWN;
        statusMessage = 'Unknown payment status';
    }

    // Update payment record
    payment.status = paymentStatus;
    payment.statusMessage = statusMessage;
    payment.responseData = additionalData ? JSON.stringify(additionalData) : null;
    payment.completedAt = new Date();

    await this.cardPaymentRepository.save(payment);

    // Create verification record
    const verification = this.paymentVerificationRepository.create({
      referenceId,
      status: paymentStatus,
      verificationData: additionalData ? JSON.stringify(additionalData) : null,
      verifiedAt: new Date(),
    });

    await this.paymentVerificationRepository.save(verification);

    // Notify Hub Shaparak about the transaction result
    try {
      await firstValueFrom(
        this.hubShaparakClient.send('record_transaction_result', {
          transactionId,
          referenceId,
          merchantId: payment.merchantId,
          amount: payment.amount,
          status: paymentStatus,
          timestamp: new Date(),
        })
      );
    } catch (error) {
      this.logger.error(`Failed to notify Hub Shaparak: ${error.message}`, error.stack);
      // Continue anyway, as this is just for record-keeping
    }

    return {
      success: paymentStatus === PaymentStatus.SUCCESSFUL,
      message: statusMessage,
    };
  }

  async verifyPayment(
    transactionId: string,
    referenceId: string,
    amount: number,
    additionalData?: any,
  ): Promise<{ verified: boolean; message?: string }> {
    this.logger.log(`Verifying payment for transaction: ${transactionId}, reference: ${referenceId}`);

    // Find the payment
    const payment = await this.cardPaymentRepository.findOne({
      where: { referenceId },
    });

    if (!payment) {
      return {
        verified: false,
        message: `Payment with reference ID ${referenceId} not found`,
      };
    }

    // Verify transaction ID matches
    if (payment.transactionId !== transactionId) {
      return {
        verified: false,
        message: 'Transaction ID mismatch',
      };
    }

    // Verify amount matches
    if (payment.amount !== amount) {
      return {
        verified: false,
        message: 'Payment amount mismatch',
      };
    }

    // Check payment status
    if (payment.status !== PaymentStatus.SUCCESSFUL) {
      return {
        verified: false,
        message: payment.statusMessage || `Payment is not successful, status: ${payment.status}`,
      };
    }

    // In a real implementation, additional verification with Shaparak would be done here
    // For demo, we'll just confirm based on our local records

    // Create verification record if it doesn't exist
    const existingVerification = await this.paymentVerificationRepository.findOne({
      where: { referenceId },
    });

    if (!existingVerification) {
      const verification = this.paymentVerificationRepository.create({
        referenceId,
        status: PaymentStatus.SUCCESSFUL,
        verificationData: additionalData ? JSON.stringify(additionalData) : null,
        verifiedAt: new Date(),
      });

      await this.paymentVerificationRepository.save(verification);
    }

    return {
      verified: true,
      message: 'Payment verified successfully',
    };
  }

  async getPaymentStatus(referenceId: string): Promise<any> {
    const payment = await this.cardPaymentRepository.findOne({
      where: { referenceId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with reference ID ${referenceId} not found`);
    }

    // Get verification info if available
    const verification = await this.paymentVerificationRepository.findOne({
      where: { referenceId },
    });

    return {
      transactionId: payment.transactionId,
      referenceId: payment.referenceId,
      merchantId: payment.merchantId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      statusMessage: payment.statusMessage,
      paymentMethod: payment.paymentMethod,
      completedAt: payment.completedAt,
      createdAt: payment.createdAt,
      verified: !!verification,
      verifiedAt: verification?.verifiedAt,
    };
  }

  async refundPayment(
    transactionId: string,
    referenceId: string,
    amount: number,
    reason?: string,
  ): Promise<{ success: boolean; message?: string }> {
    this.logger.log(`Refunding payment for transaction: ${transactionId}, reference: ${referenceId}`);

    // Find the payment
    const payment = await this.cardPaymentRepository.findOne({
      where: { referenceId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with reference ID ${referenceId} not found`);
    }

    // Verify transaction ID matches
    if (payment.transactionId !== transactionId) {
      throw new BadRequestException('Transaction ID mismatch');
    }

    // Check if payment is successful
    if (payment.status !== PaymentStatus.SUCCESSFUL) {
      throw new BadRequestException(`Cannot refund payment, status: ${payment.status}`);
    }

    // Verify refund amount is valid
    if (amount <= 0 || amount > payment.amount) {
      throw new BadRequestException('Invalid refund amount');
    }

    // In a real implementation, this would call Shaparak API to process the refund
    // For demo, we'll simulate the refund

    // Create a refund record
    const refundReferenceId = `REF-${referenceId}`;
    const refund = this.cardPaymentRepository.create({
      transactionId: `REFUND-${transactionId}`,
      referenceId: refundReferenceId,
      originalReferenceId: referenceId,
      amount: amount,
      currency: payment.currency,
      merchantId: payment.merchantId,
      status: PaymentStatus.SUCCESSFUL,
      statusMessage: 'Refund processed successfully',
      paymentMethod: 'REFUND',
      description: reason || 'Refund for transaction',
      completedAt: new Date(),
    });

    await this.cardPaymentRepository.save(refund);

    // Update original payment if full refund
    if (amount === payment.amount) {
      payment.status = PaymentStatus.REFUNDED;
      payment.statusMessage = 'Payment fully refunded';
      await this.cardPaymentRepository.save(payment);
    }

    // Notify Hub Shaparak about the refund
    try {
      await firstValueFrom(
        this.hubShaparakClient.send('record_refund', {
          originalTransactionId: transactionId,
          originalReferenceId: referenceId,
          refundTransactionId: refund.transactionId,
          refundReferenceId: refundReferenceId,
          merchantId: payment.merchantId,
          amount,
          reason,
          timestamp: new Date(),
        })
      );
    } catch (error) {
      this.logger.error(`Failed to notify Hub Shaparak: ${error.message}`, error.stack);
      // Continue anyway, as this is just for record-keeping
    }

    return {
      success: true,
      message: 'Refund processed successfully',
    };
  }

  private generateReferenceId(): string {
    // In real implementation, this would be from Shaparak
    return `SPK-${uuidv4().substring(0, 8).toUpperCase()}`;
  }

  private buildGatewayUrl(payment: CardPayment, merchant: any): string {
    // In real implementation, this would be Shaparak's payment gateway URL
    const baseUrl = 'https://shaparak.ir/payment/gateway';
    const params = new URLSearchParams();
    params.append('merchantId', merchant.merchantId);
    params.append('terminalId', merchant.terminalId);
    params.append('referenceId', payment.referenceId);
    params.append('amount', payment.amount.toString());
    params.append('callbackUrl', payment.callbackUrl);
    
    return `${baseUrl}?${params.toString()}`;
  }
}