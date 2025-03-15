// services/ledger.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { Ledger } from '../entities/ledger.entity';
import { TransactionStatus } from '../enums/transaction-status.enum';

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(
    @InjectRepository(Ledger)
    private readonly ledgerRepository: Repository<Ledger>,
  ) {}

  async createLedgerEntries(transaction: Transaction): Promise<void> {
    try {
      // Create debit entry for originator bank
      const debitEntry = this.ledgerRepository.create({
        transactionId: transaction.id,
        bankCode: transaction.originatorBankCode,
        accountNumber: transaction.originatorAccount,
        entryType: 'DEBIT',
        amount: transaction.amount,
        currency: transaction.currency,
        entryDate: transaction.transactionDate,
        description: `Debit for transaction ${transaction.referenceId}`,
        referenceId: transaction.referenceId,
        metadata: transaction.metadata,
      });

      // Create credit entry for destination bank
      const creditEntry = this.ledgerRepository.create({
        transactionId: transaction.id,
        bankCode: transaction.destinationBankCode,
        accountNumber: transaction.destinationAccount,
        entryType: 'CREDIT',
        amount: transaction.amount,
        currency: transaction.currency,
        entryDate: transaction.transactionDate,
        description: `Credit for transaction ${transaction.referenceId}`,
        referenceId: transaction.referenceId,
        metadata: transaction.metadata,
      });

      // Create fee entry if fee amount is greater than zero
      let feeEntry = null;
      if (transaction.feeAmount > 0) {
        feeEntry = this.ledgerRepository.create({
          transactionId: transaction.id,
          bankCode: transaction.originatorBankCode, // Fee typically charged to originator
          accountNumber: transaction.originatorAccount,
          entryType: 'DEBIT',
          amount: transaction.feeAmount,
          currency: transaction.currency,
          entryDate: transaction.transactionDate,
          description: `Fee for transaction ${transaction.referenceId}`,
          referenceId: transaction.referenceId,
          metadata: { ...transaction.metadata, feeType: 'transaction_fee' },
        });
      }

      // Save all entries
      const entries = [debitEntry, creditEntry];
      if (feeEntry) {
        entries.push(feeEntry);
      }
      
      await this.ledgerRepository.save(entries);
      
      this.logger.log(`Created ${entries.length} ledger entries for transaction ${transaction.id}`);
    } catch (error) {
      this.logger.error(
        `Error creating ledger entries for transaction ${transaction.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async updateLedgerEntriesForSettlement(transactionId: string): Promise<void> {
    try {
      // Update all ledger entries for this transaction
      // In a real system, this might involve more complex logic
      const entries = await this.ledgerRepository.find({
        where: { transactionId },
      });

      for (const entry of entries) {
        entry.metadata = {
          ...entry.metadata,
          settlementDate: new Date(),
          status: TransactionStatus.SETTLED,
        };
      }

      await this.ledgerRepository.save(entries);
      
      this.logger.log(`Updated ${entries.length} ledger entries for settled transaction ${transactionId}`);
    } catch (error) {
      this.logger.error(
        `Error updating ledger entries for settlement of transaction ${transactionId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getLedgerEntriesByBank(
    bankCode: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Ledger[]> {
    return this.ledgerRepository.find({
      where: {
        bankCode,
        entryDate: {
          $gte: startDate,
          $lte: endDate,
        } as any,
      },
      order: { entryDate: 'ASC' },
    });
  }

  async getLedgerEntriesByAccount(
    bankCode: string,
    accountNumber: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Ledger[]> {
    return this.ledgerRepository.find({
      where: {
        bankCode,
        accountNumber,
        entryDate: {
          $gte: startDate,
          $lte: endDate,
        } as any,
      },
      order: { entryDate: 'ASC' },
    });
  }
}