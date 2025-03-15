// payment/services/payment-processor.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PaymentProcessorService {
  constructor(
    @Inject('PSP_SERVICE') private pspClient: ClientProxy,
    @Inject('BANK_SOURCE_SERVICE') private bankSourceClient: ClientProxy,
    @Inject('SHAPARAK_SERVICE') private shaparakClient: ClientProxy,
  ) {}

  async processPspRequest(payload: any): Promise<any> {
    return firstValueFrom(
      this.pspClient.send('process_payment', payload),
    );
  }

  async verifyWithShaparak(payload: any): Promise<any> {
    return firstValueFrom(
      this.shaparakClient.send('verify_payment', payload),
    );
  }

  async settleBankTransaction(payload: any): Promise<any> {
    return firstValueFrom(
      this.bankSourceClient.send('settle_transaction', payload),
    );
  }
}
