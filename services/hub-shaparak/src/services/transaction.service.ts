// services/transaction.service.ts
import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Inject,
    Logger,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository, Between, FindOptionsWhere } from 'typeorm';
  import { ClientProxy } from '@nestjs/microservices';
  import { ConfigService } from '@nestjs/config';
  import { firstValueFrom } from 'rxjs';
  import { EventEmitter2 } from '@nestjs/event-emitter';
  import { Transaction } from '../entities/transaction.entity';
  import { Ledger } from '../entities/ledger.entity';
  import { RecordTransactionDto } from '../dto/request/record-transaction.dto';
  import { VerifyTransactionDto } from '../dto/request/verify-transaction.dto';
  import { TransactionResponseDto } from '../dto/response/transaction-response.dto';
  import { LedgerResponseDto } from '../dto/response/ledger-response.dto';
  import { TransactionStatus } from '../enums/transaction-status.enum';
  import { LedgerService } from './ledger.service';
  
  @Injectable()
  export class TransactionService {
    private readonly logger = new Logger(TransactionService.name);
  
    constructor(
      @InjectRepository(Transaction)
      private readonly transactionRepository: Repository<Transaction>,
      @InjectRepository(Ledger)
      private readonly ledgerRepository: Repository<Ledger>,
      private readonly ledgerService: LedgerService,
      private readonly eventEmitter: EventEmitter2,
      private readonly configService: ConfigService,
      @Inject('BANK_SOURCE_SERVICE') private bankSourceClient: ClientProxy,
      @Inject('BANK_DESTINATION_SERVICE') private bankDestinationClient: ClientProxy,
      @Inject('SHAPARAK_SERVICE') private shaparakClient: ClientProxy,
    ) {}
  
    async recordTransaction(
      recordTransactionDto: RecordTransactionDto,
    ): Promise<TransactionResponseDto> {
      // Check if transaction already exists with the same reference ID
      const existingTransaction = await this.getTransactionByReferenceId(
        recordTransactionDto.referenceId,
      );
  
      if (existingTransaction) {
        throw new BadRequestException(
          `Transaction with reference ID ${recordTransactionDto.referenceId} already exists`,
        );
      }
  
      // Calculate fee amount based on transaction details
      const feeAmount = this.calculateFeeAmount(recordTransactionDto);
  
      // Create the transaction record
      const transaction = this.transactionRepository.create({
        referenceId: recordTransactionDto.referenceId,
        transactionDate: new Date(recordTransactionDto.transactionDate),
        originatorBankCode: recordTransactionDto.originatorBankCode,
        destinationBankCode: recordTransactionDto.destinationBankCode,
        originatorAccount: recordTransactionDto.originatorAccount,
        destinationAccount: recordTransactionDto.destinationAccount,
        amount: recordTransactionDto.amount,
        currency: recordTransactionDto.currency || 'IRR',
        status: TransactionStatus.PENDING,
        statusDetail: 'Transaction recorded, awaiting processing',
        merchantId: recordTransactionDto.merchantId,
        terminalId: recordTransactionDto.terminalId,
        description: recordTransactionDto.description,
        metadata: recordTransactionDto.metadata,
        feeAmount,
      });
  
      const savedTransaction = await this.transactionRepository.save(transaction);
  
      // Create ledger entries for the transaction
      await this.ledgerService.createLedgerEntries(savedTransaction);
  
      // Emit event for transaction recording
      this.eventEmitter.emit('transaction.recorded', {
        type: 'transaction.recorded',
        transactionId: savedTransaction.id,
        referenceId: savedTransaction.referenceId,
        status: savedTransaction.status,
        timestamp: new Date(),
      });
  
      // Process the transaction asynchronously
      this.processTransaction(savedTransaction.id).catch((error) => {
        this.logger.error(
          `Error processing transaction ${savedTransaction.id}: ${error.message}`,
          error.stack,
        );
      });
  
      return this.mapToTransactionResponseDto(savedTransaction);
    }
  
    async verifyTransaction(
      verifyTransactionDto: VerifyTransactionDto,
    ): Promise<TransactionResponseDto> {
      const transaction = await this.getTransactionByReferenceId(
        verifyTransactionDto.referenceId,
      );
  
      if (!transaction) {
        throw new NotFoundException(
          `Transaction with reference ID ${verifyTransactionDto.referenceId} not found`,
        );
      }
  
      // Update verification details
      if (verifyTransactionDto.verificationCode) {
        transaction.verificationCode = verifyTransactionDto.verificationCode;
      }
  
      // Already settled or failed transactions cannot be verified again
      if (
        transaction.status === TransactionStatus.SETTLED ||
        transaction.status === TransactionStatus.FAILED ||
        transaction.status === TransactionStatus.CANCELLED
      ) {
        return this.mapToTransactionResponseDto(transaction);
      }
  
      try {
        // Verify with source bank
        const sourceVerification = await firstValueFrom(
          this.bankSourceClient.send('verify_transaction', {
            bankCode: transaction.originatorBankCode,
            referenceId: transaction.referenceId,
            verificationCode: verifyTransactionDto.verificationCode,
            additionalData: verifyTransactionDto.additionalData,
          }),
        );
  
        // Verify with destination bank
        const destinationVerification = await firstValueFrom(
          this.bankDestinationClient.send('verify_transaction', {
            bankCode: transaction.destinationBankCode,
            referenceId: transaction.referenceId,
            verificationCode: verifyTransactionDto.verificationCode,
            additionalData: verifyTransactionDto.additionalData,
          }),
        );
  
        // Verify with Shaparak
        const shaparakVerification = await firstValueFrom(
          this.shaparakClient.send('verify_transaction', {
            transactionId: transaction.id,
            referenceId: transaction.referenceId,
            amount: transaction.amount,
            verificationCode: verifyTransactionDto.verificationCode,
            additionalData: verifyTransactionDto.additionalData,
          }),
        );
  
        // Update transaction status based on verification results
        if (
          sourceVerification.verified &&
          destinationVerification.verified &&
          shaparakVerification.verified
        ) {
          transaction.status = TransactionStatus.SETTLED;
          transaction.statusDetail = 'Transaction verified and settled successfully';
          transaction.trackingCode = shaparakVerification.trackingCode || transaction.trackingCode;
          
          // Update ledger entries to reflect settlement
          await this.ledgerService.updateLedgerEntriesForSettlement(transaction.id);
        } else {
          transaction.status = TransactionStatus.FAILED;
          transaction.statusDetail = 'Transaction verification failed';
        }
  
        const updatedTransaction = await this.transactionRepository.save(transaction);
  
        // Emit event for transaction verification
        this.eventEmitter.emit('transaction.verified', {
          type: 'transaction.verified',
          transactionId: updatedTransaction.id,
          referenceId: updatedTransaction.referenceId,
          status: updatedTransaction.status,
          timestamp: new Date(),
          data: {
            sourceVerification,
            destinationVerification,
            shaparakVerification,
          },
        });
  
        return this.mapToTransactionResponseDto(updatedTransaction);
      } catch (error) {
        this.logger.error(
          `Error verifying transaction ${transaction.id}: ${error.message}`,
          error.stack,
        );
  
        // Update transaction status to reflect verification failure
        transaction.status = TransactionStatus.FAILED;
        transaction.statusDetail = `Verification failed: ${error.message}`;
        const updatedTransaction = await this.transactionRepository.save(transaction);
  
        this.eventEmitter.emit('transaction.verification_failed', {
          type: 'transaction.verification_failed',
          transactionId: updatedTransaction.id,
          referenceId: updatedTransaction.referenceId,
          status: updatedTransaction.status,
          timestamp: new Date(),
          error: error.message,
        });
  
        return this.mapToTransactionResponseDto(updatedTransaction);
      }
    }
  
    async getTransactionById(id: string): Promise<TransactionResponseDto | null> {
      const transaction = await this.transactionRepository.findOne({
        where: { id },
      });
  
      if (!transaction) {
        return null;
      }
  
      return this.mapToTransactionResponseDto(transaction);
    }
  
    async getTransactionByReferenceId(
      referenceId: string,
    ): Promise<TransactionResponseDto | null> {
      const transaction = await this.transactionRepository.findOne({
        where: { referenceId },
      });
  
      if (!transaction) {
        return null;
      }
  
      return this.mapToTransactionResponseDto(transaction);
    }
  
    async getTransactions(filters: {
      status?: TransactionStatus;
      originatorBank?: string;
      destinationBank?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }): Promise<{ transactions: TransactionResponseDto[]; total: number; page: number; limit: number }> {
      const { 
        status, 
        originatorBank, 
        destinationBank, 
        startDate, 
        endDate, 
        page = 1, 
        limit = 10 
      } = filters;
  
      // Build where conditions
      const where: FindOptionsWhere<Transaction> = {};
  
      if (status) {
        where.status = status;
      }
  
      if (originatorBank) {
        where.originatorBankCode = originatorBank;
      }
  
      if (destinationBank) {
        where.destinationBankCode = destinationBank;
      }
  
      if (startDate && endDate) {
        where.transactionDate = Between(new Date(startDate), new Date(endDate));
      } else if (startDate) {
        where.transactionDate = Between(new Date(startDate), new Date());
      } else if (endDate) {
        where.transactionDate = Between(new Date('1970-01-01'), new Date(endDate));
      }
  
      // Query transactions with pagination
      const [transactions, total] = await this.transactionRepository.findAndCount({
        where,
        order: { transactionDate: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
  
      return {
        transactions: transactions.map(this.mapToTransactionResponseDto),
        total,
        page,
        limit,
      };
    }
  
    async getLedgerEntriesForTransaction(
      transactionId: string,
    ): Promise<LedgerResponseDto[] | null> {
      const transaction = await this.transactionRepository.findOne({
        where: { id: transactionId },
      });
  
      if (!transaction) {
        return null;
      }
  
      const ledgerEntries = await this.ledgerRepository.find({
        where: { transactionId },
        order: { entryDate: 'ASC' },
      });
  
      return ledgerEntries.map(this.mapToLedgerResponseDto);
    }
  
    async updateTransactionStatus(
      id: string,
      status: TransactionStatus,
      statusDetail?: string,
    ): Promise<TransactionResponseDto> {
      const transaction = await this.transactionRepository.findOne({
        where: { id },
      });
  
      if (!transaction) {
        throw new NotFoundException(`Transaction with ID ${id} not found`);
      }
  
      transaction.status = status;
      if (statusDetail) {
        transaction.statusDetail = statusDetail;
      }
      transaction.updatedAt = new Date();
  
      const updatedTransaction = await this.transactionRepository.save(transaction);
  
      // Emit event for status update
      this.eventEmitter.emit('transaction.status_updated', {
        type: 'transaction.status_updated',
        transactionId: updatedTransaction.id,
        referenceId: updatedTransaction.referenceId,
        status: updatedTransaction.status,
        timestamp: new Date(),
      });
  
      return this.mapToTransactionResponseDto(updatedTransaction);
    }
  
    private async processTransaction(transactionId: string): Promise<void> {
      const transaction = await this.transactionRepository.findOne({
        where: { id: transactionId },
      });
  
      if (!transaction) {
        throw new NotFoundException(`Transaction with ID ${transactionId} not found`);
      }
  
      // Update status to processing
      transaction.status = TransactionStatus.PROCESSING;
      transaction.statusDetail = 'Transaction is being processed';
      await this.transactionRepository.save(transaction);
  
      try {
        // Process with source bank
        const sourceResponse = await firstValueFrom(
          this.bankSourceClient.send('process_transaction', {
            bankCode: transaction.originatorBankCode,
            accountNumber: transaction.originatorAccount,
            amount: transaction.amount,
            currency: transaction.currency,
            referenceId: transaction.referenceId,
            transactionDate: transaction.transactionDate,
            description: transaction.description,
            metadata: transaction.metadata,
          }),
        );
  
        // Process with destination bank
        const destinationResponse = await firstValueFrom(
          this.bankDestinationClient.send('process_transaction', {
            bankCode: transaction.destinationBankCode,
            accountNumber: transaction.destinationAccount,
            amount: transaction.amount,
            currency: transaction.currency,
            referenceId: transaction.referenceId,
            transactionDate: transaction.transactionDate,
            description: transaction.description,
            metadata: transaction.metadata,
          }),
        );
  
        // Process with Shaparak
        const shaparakResponse = await firstValueFrom(
          this.shaparakClient.send('process_transaction', {
            transactionId: transaction.id,
            referenceId: transaction.referenceId,
            amount: transaction.amount,
            currency: transaction.currency,
            originatorBankCode: transaction.originatorBankCode,
            destinationBankCode: transaction.destinationBankCode,
            originatorAccount: transaction.originatorAccount,
            destinationAccount: transaction.destinationAccount,
            merchantId: transaction.merchantId,
            terminalId: transaction.terminalId,
            description: transaction.description,
            metadata: transaction.metadata,
          }),
        );
  
        // Update transaction with responses
        transaction.status = TransactionStatus.AUTHORIZED;
        transaction.statusDetail = 'Transaction authorized, awaiting settlement';
        transaction.verificationCode = shaparakResponse.verificationCode;
        transaction.trackingCode = shaparakResponse.trackingCode;
        await this.transactionRepository.save(transaction);
  
        // Emit event for successful processing
        this.eventEmitter.emit('transaction.processed', {
          type: 'transaction.processed',
          transactionId: transaction.id,
          referenceId: transaction.referenceId,
          status: transaction.status,
          timestamp: new Date(),
          data: {
            sourceResponse,
            destinationResponse,
            shaparakResponse,
          },
        });
      } catch (error) {
        this.logger.error(
          `Error processing transaction ${transaction.id}: ${error.message}`,
          error.stack,
        );
  
        // Update transaction to reflect processing failure
        transaction.status = TransactionStatus.FAILED;
        transaction.statusDetail = `Processing failed: ${error.message}`;
        transaction.retryCount += 1;
        await this.transactionRepository.save(transaction);
  
        // Emit event for processing failure
        this.eventEmitter.emit('transaction.processing_failed', {
          type: 'transaction.processing_failed',
          transactionId: transaction.id,
          referenceId: transaction.referenceId,
          status: transaction.status,
          timestamp: new Date(),
          error: error.message,
        });
  
        // Retry processing if retry count is below threshold
        const maxRetryAttempts = this.configService.get<number>('MAX_RETRY_ATTEMPTS', 3);
        if (transaction.retryCount < maxRetryAttempts) {
          this.logger.log(
            `Scheduling retry (${transaction.retryCount}/${maxRetryAttempts}) for transaction ${transaction.id}`,
          );
          
          // Schedule retry after delay
          setTimeout(() => {
            this.processTransaction(transaction.id).catch((retryError) => {
              this.logger.error(
                `Error in retry processing transaction ${transaction.id}: ${retryError.message}`,
                retryError.stack,
              );
            });
          }, this.calculateRetryDelay(transaction.retryCount));
        }
      }
    }
  
    private calculateFeeAmount(recordTransactionDto: RecordTransactionDto): number {
      // Simple fee calculation: 0.5% of transaction amount
      // In a real system, this would consider bank agreements, transaction types, etc.
      const feePercentage = 0.5;
      return (recordTransactionDto.amount * feePercentage) / 100;
    }
  
    private calculateRetryDelay(retryCount: number): number {
      // Exponential backoff: 5 seconds, 20 seconds, 60 seconds
      return Math.min(60000, 5000 * Math.pow(2, retryCount));
    }
  
    private mapToTransactionResponseDto(transaction: Transaction): TransactionResponseDto {
      return {
        id: transaction.id,
        referenceId: transaction.referenceId,
        transactionDate: transaction.transactionDate,
        originatorBankCode: transaction.originatorBankCode,
        destinationBankCode: transaction.destinationBankCode,
        originatorAccount: transaction.originatorAccount,
        destinationAccount: transaction.destinationAccount,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        statusDetail: transaction.statusDetail,
        verificationCode: transaction.verificationCode,
        trackingCode: transaction.trackingCode,
        merchantId: transaction.merchantId,
        terminalId: transaction.terminalId,
        description: transaction.description,
        metadata: transaction.metadata,
        feeAmount: transaction.feeAmount,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      };
    }
  
    private mapToLedgerResponseDto(ledger: Ledger): LedgerResponseDto {
      return {
        id: ledger.id,
        transactionId: ledger.transactionId,
        bankCode: ledger.bankCode,
        accountNumber: ledger.accountNumber,
        entryType: ledger.entryType,
        amount: ledger.amount,
        currency: ledger.currency,
        entryDate: ledger.entryDate,
        description: ledger.description,
        referenceId: ledger.referenceId,
        metadata: ledger.metadata,
        createdAt: ledger.createdAt,
      };
    }
  }
  
  