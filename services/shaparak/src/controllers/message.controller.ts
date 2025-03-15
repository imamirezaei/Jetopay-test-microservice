import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ShaparakService } from '../services/shaparak.service';
import { CardPaymentService } from '../services/card-payment.service';
import { MerchantService } from '../services/merchant.service';

@Controller()
export class MessageController {
  constructor(
    private readonly shaparakService: ShaparakService,
    private readonly cardPaymentService: CardPaymentService,
    private readonly merchantService: MerchantService,
  ) {}

  @MessagePattern('initiate_card_payment')
  async initiateCardPayment(
    @Payload() data: {
      transactionId: string;
      amount: number;
      currency: string;
      cardInfo: any;
      merchantId: string;
      callbackUrl: string;
    },
  ) {
    return this.cardPaymentService.initiateCardPayment(
      data.transactionId,
      data.amount,
      data.currency,
      data.cardInfo,
      data.merchantId,
      data.callbackUrl,
    );
  }

  @MessagePattern('verify_payment')
  async verifyPayment(
    @Payload() data: {
      transactionId: string;
      referenceId: string;
      amount: number;
      additionalData?: any;
    },
  ) {
    return this.cardPaymentService.verifyPayment(
      data.transactionId,
      data.referenceId,
      data.amount,
      data.additionalData,
    );
  }

  @MessagePattern('get_merchant_info')
  async getMerchantInfo(
    @Payload() data: { merchantId: string },
  ) {
    return this.merchantService.getMerchantInfo(data.merchantId);
  }

  @MessagePattern('verify_merchant')
  async verifyMerchant(
    @Payload() data: { merchantId: string; terminalId?: string },
  ) {
    return this.merchantService.verifyMerchant(
      data.merchantId,
      data.terminalId,
    );
  }

  @MessagePattern('get_payment_status')
  async getPaymentStatus(
    @Payload() data: { referenceId: string },
  ) {
    return this.cardPaymentService.getPaymentStatus(data.referenceId);
  }

  @MessagePattern('get_transaction_history')
  async getTransactionHistory(
    @Payload() data: {
      merchantId: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    return this.shaparakService.getTransactionHistory(
      data.merchantId,
      data.startDate ? new Date(data.startDate) : undefined,
      data.endDate ? new Date(data.endDate) : undefined,
      data.limit,
      data.offset,
    );
  }

  @MessagePattern('refund_payment')
  async refundPayment(
    @Payload() data: {
      transactionId: string;
      referenceId: string;
      amount: number;
      reason?: string;
    },
  ) {
    return this.cardPaymentService.refundPayment(
      data.transactionId,
      data.referenceId,
      data.amount,
      data.reason,
    );
  }

  @MessagePattern('check_card_validity')
  async checkCardValidity(
    @Payload() data: {
      cardNumber: string;
      expiryMonth: string;
      expiryYear: string;
    },
  ) {
    return this.shaparakService.checkCardValidity(
      data.cardNumber,
      data.expiryMonth,
      data.expiryYear,
    );
  }

  @MessagePattern('card_bin_lookup')
  async cardBinLookup(
    @Payload() data: { cardBin: string },
  ) {
    return this.shaparakService.cardBinLookup(data.cardBin);
  }
}