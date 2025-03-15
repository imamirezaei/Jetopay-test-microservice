import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { InterbankTransaction } from '../entities/interbank-transaction.entity';
import { BankInfo } from '../entities/bank-info.entity';
import { InterbankTransferDto } from '../dto/interbank-transfer.dto';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { RoutingService } from './routing.service';

@Injectable()
export class InterbankService {
  private readonly logger = new Logger(InterbankService.name);

  constructor(
    @InjectRepository(InterbankTransaction)
    private readonly transactionRepository: Repository<InterbankTransaction>,
    @InjectRepository(BankInfo)
    private readonly bankInfoRepository: Repository<BankInfo>,
    private readonly routingService: RoutingService,
    private readonly configService: ConfigService,
  ) {}

  async initiateTransfer(transferData: InterbankTransferDto): Promise<any> {
    this.logger.log(`Initiating interbank transfer: ${JSON.stringify(transferData)}`);

    // Validate source and destination banks
    const sourceBankInfo = await this.getBankInfo(transferData.sourceBankCode);
    const destBankInfo = await this.getBankInfo(transferData.destinationBankCode);

    if (!sourceBankInfo || !destBankInfo) {
      throw new BadRequestException('Invalid bank code');
    }

    // Generate a unique reference ID for this transaction
    const referenceId = this.generateReferenceId();

    // Create a transaction record
    const transaction = this.transactionRepository.create({
      referenceId,
      amount: transferData.amount,
      fee: this.calculateFee(transferData.amount),
      sourceBankCode: transferData.sourceBankCode,
      sourceAccountNumber: transferData.sourceAccountNumber,
      destinationBankCode: transferData.destinationBankCode,
      destinationAccountNumber: transferData.destinationAccountNumber,
      status: TransactionStatus.PENDING,
      description: transferData.description,
      transactionId: transferData.transactionId,
      metadata: transferData.metadata,
    });

    await this.transactionRepository.save(transaction);

    try {
      // Route the transaction to the appropriate bank endpoint
      const routingResult = await this.routingService.routeTransaction({
        referenceId,
        sourceBankCode: transferData.sourceBankCode,
        destinationBankCode: transferData.destinationBankCode,
        amount: transferData.amount,
        fee: transaction.fee,
        sourceAccountNumber: transferData.sourceAccountNumber,
        destinationAccountNumber: transferData.destinationAccountNumber,
      });

      if (routingResult.success) {
        // Update transaction status
        await this.transactionRepository.update(
          { referenceId },
          { 
            status: TransactionStatus.PROCESSING,
            bankReferenceId: routingResult.bankReferenceId,
          }
        );

        return {
          success: true,
          referenceId,
          bankReferenceId: routingResult.bankReferenceId,
          status: TransactionStatus.PROCESSING,
          message: 'Interbank transfer initiated successfully',
        };
      } else {
        // Update transaction status to failed
        await this.transactionRepository.update(
          { referenceId },
          { 
            status: TransactionStatus.FAILED,
            failureReason: routingResult.message,
          }
        );

        return {
          success: false,
          referenceId,
          status: TransactionStatus.FAILED,
          message: routingResult.message,
        };
      }
    } catch (error) {
      this.logger.error(`Error initiating interbank transfer: ${error.message}`, error.stack);

      // Update transaction status to failed
      await this.transactionRepository.update(
        { referenceId },
        { 
          status: TransactionStatus.FAILED,
          failureReason: error.message,
        }
      );

      throw new BadRequestException(`Failed to initiate interbank transfer: ${error.message}`);
    }
  }

  async verifyTransfer(referenceId: string): Promise<any> {
    this.logger.log(`Verifying interbank transfer: ${referenceId}`);

    const transaction = await this.transactionRepository.findOne({
      where: { referenceId },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with reference ID ${referenceId} not found`);
    }

    // If transaction is already completed or failed, return status
    if (
      transaction.status === TransactionStatus.COMPLETED ||
      transaction.status === TransactionStatus.FAILED
    ) {
      return {
        success: transaction.status === TransactionStatus.COMPLETED,
        referenceId,
        status: transaction.status,
        bankReferenceId: transaction.bankReferenceId,
        message: transaction.status === TransactionStatus.FAILED 
          ? transaction.failureReason 
          : 'Transaction completed successfully',
      };
    }

    try {
      // Check status with the bank
      const statusResult = await this.routingService.checkTransactionStatus({
        referenceId,
        bankReferenceId: transaction.bankReferenceId,
        sourceBankCode: transaction.sourceBankCode,
        destinationBankCode: transaction.destinationBankCode,
      });

      // Update transaction status based on bank response
      await this.transactionRepository.update(
        { referenceId },
        { 
          status: statusResult.status,
          failureReason: statusResult.message,
          completedAt: statusResult.status === TransactionStatus.COMPLETED 
            ? new Date() 
            : null,
        }
      );

      return {
        success: statusResult.status === TransactionStatus.COMPLETED,
        referenceId,
        status: statusResult.status,
        bankReferenceId: transaction.bankReferenceId,
        message: statusResult.message,
      };
    } catch (error) {
      this.logger.error(`Error verifying interbank transfer: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to verify interbank transfer: ${error.message}`);
    }
  }

  async getBankInfo(bankCode: string): Promise<BankInfo> {
    return this.bankInfoRepository.findOne({
      where: { code: bankCode },
    });
  }

  private generateReferenceId(): string {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `SHT${timestamp}${random}`;
  }

  private calculateFee(amount: number): number {
    // Fee calculation logic based on transaction amount
    // In a real implementation, this would be based on specific bank policies
    const baseFee = this.configService.get<number>('INTERBANK_BASE_FEE', 10000); // 10,000 IRR
    const percentageFee = amount * 0.001; // 0.1% of transaction amount
    
    return Math.min(baseFee + percentageFee, 100000); // Cap at 100,000 IRR
  }
}