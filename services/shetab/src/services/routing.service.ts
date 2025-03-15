import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankInfo } from '../entities/bank-info.entity';

@Injectable()
export class RoutingService {
  constructor(
    @InjectRepository(BankInfo)
    private readonly bankInfoRepository: Repository<BankInfo>,
  ) {}

  async findBankByCode(bankCode: string): Promise<BankInfo | null> {
    return await this.bankInfoRepository.findOne({
      where: { code: bankCode },
    });
  }

  async findBankById(id: string): Promise<BankInfo | null> {
    return await this.bankInfoRepository.findOne({
      where: { id },
    });
  }

  async getAllBanks(): Promise<BankInfo[]> {
    return await this.bankInfoRepository.find({
      order: { name: 'ASC' },
    });
  }

  async updateBankInfo(id: string, data: Partial<BankInfo>): Promise<BankInfo | null> {
    const bank = await this.findBankById(id);
    if (!bank) return null;

    Object.assign(bank, data);
    return await this.bankInfoRepository.save(bank);
  }

  async createBankInfo(data: Partial<BankInfo>): Promise<BankInfo> {
    const bank = this.bankInfoRepository.create(data);
    return await this.bankInfoRepository.save(bank);
  }
}