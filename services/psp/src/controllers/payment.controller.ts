import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PaymentService } from '../services/payment.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('psp')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @MessagePattern('process_payment')
  async processPayment(@Payload() data: any) {
    const { 
      transactionId, 
      userId, 
      amount, 
      currency, 
      paymentMethod, 
      merchantId, 
      description, 
      callbackUrl 
    } = data;
    
    return this.paymentService.processPayment({
      transactionId,
      userId,
      amount,
      currency,
      paymentMethod,
      merchantId,
      description,
      callbackUrl,
    });
  }

  @MessagePattern('verify_payment')
  async verifyPayment(@Payload() data: any) {
    const { transactionId, referenceId, amount } = data;
    
    return this.paymentService.verifyPayment(transactionId, referenceId, amount);
  }

  @MessagePattern('check_transaction_status')
  async checkTransactionStatus(@Payload() data: any) {
    const { transactionId } = data;
    
    return this.paymentService.checkTransactionStatus(transactionId);
  }

  @MessagePattern('cancel_transaction')
  async cancelTransaction(@Payload() data: any) {
    const { transactionId, reason } = data;
    
    return this.paymentService.cancelTransaction(transactionId, reason);
  }
}