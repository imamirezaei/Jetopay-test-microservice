import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InterbankService } from '../services/interbank.service';
import { SettlementService } from '../services/settlement.service';
import { InterbankTransferDto } from '../dto/interbank-transfer.dto';
import { SettlementDto } from '../dto/settlement.dto';

@Controller()
export class MessageController {
  constructor(
    private readonly interbankService: InterbankService,
    private readonly settlementService: SettlementService,
  ) {}

  @MessagePattern('initiate_bank_transfer')
  async initiateBankTransfer(@Payload() data: InterbankTransferDto) {
    return this.interbankService.initiateTransfer(data);
  }

  @MessagePattern('verify_bank_transfer')
  async verifyBankTransfer(@Payload() data: { referenceId: string }) {
    return this.interbankService.verifyTransfer(data.referenceId);
  }

  @MessagePattern('process_settlement')
  async processSettlement(@Payload() data: SettlementDto) {
    return this.settlementService.processSettlement(data);
  }

  @MessagePattern('check_settlement_status')
  async checkSettlementStatus(@Payload() data: { batchId: string }) {
    return this.settlementService.getSettlementStatus(data.batchId);
  }

  @MessagePattern('get_bank_info')
  async getBankInfo(@Payload() data: { bankCode: string }) {
    return this.interbankService.getBankInfo(data.bankCode);
  }
}