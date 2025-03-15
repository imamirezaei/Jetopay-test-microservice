import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettlementBatch, SettlementStatus } from '../entities/settlement-batch.entity';
import { TransactionStatus } from '../enums/transaction-status.enum';

@Injectable()
export class SettlementService {
  constructor(
    @InjectRepository(SettlementBatch)
    private readonly settlementBatchRepository: Repository<SettlementBatch>,
  ) {}

  async createSettlementBatch(data: Partial<SettlementBatch>): Promise<SettlementBatch> {
    const batch = this.settlementBatchRepository.create(data);
    return await this.settlementBatchRepository.save(batch);
  }

  async getSettlementBatchById(id: string): Promise<SettlementBatch | null> {
    return await this.settlementBatchRepository.findOne({
      where: { id },
      relations: ['transactions'],
    });
  }

  async updateSettlementBatchStatus(
    id: string,
    status: TransactionStatus,
  ): Promise<SettlementBatch | null> {
    const batch = await this.getSettlementBatchById(id);
    if (!batch) return null;

      type NewType = SettlementStatus;

    batch.status = status as unknown as NewType;
    if (status === TransactionStatus.COMPLETED) {
      batch.completedAt = new Date();
    }

    return await this.settlementBatchRepository.save(batch);
  }

  async getSettlementBatches(page = 1, limit = 10): Promise<[SettlementBatch[], number]> {
    return await this.settlementBatchRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['transactions'],
    });
  }
}