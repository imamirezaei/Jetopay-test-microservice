import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BankCode } from '../enums/bank-code.enum';
import { RecordTransactionDto } from '../dto/request/record-transaction.dto';
import { Logger } from './logger';

/**
 * Utility class for validating transactions according to Shaparak and CBI standards
 */
@Injectable()
export class TransactionValidator {
  // Threshold amount that requires extra validation
  private readonly highValueTransactionThreshold: number;
  
  // Maximum allowable transaction amount
  private readonly maxTransactionAmount: number;
  
  // National bank codes that are currently active
  private readonly activeBankCodes: string[];
  
  constructor(private configService: ConfigService) {
    this.highValueTransactionThreshold = configService.get<number>('HIGH_VALUE_TRANSACTION_THRESHOLD', 500000000); // 500M IRR
    this.maxTransactionAmount = configService.get<number>('MAX_TRANSACTION_AMOUNT', 10000000000); // 10B IRR
    this.activeBankCodes = Object.values(BankCode).filter(code => code !== BankCode.TEST_BANK);
  }

  /**
   * Validates a transaction for CBI compliance
   * @param transaction Transaction to validate
   * @returns Object with validation result and any error messages
   */
  validateTransaction(transaction: RecordTransactionDto): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate reference ID
    if (!this.isValidReferenceId(transaction.referenceId)) {
      errors.push('Invalid reference ID format');
    }

    // Validate bank codes
    if (!this.isValidBankCode(transaction.originatorBankCode)) {
      errors.push(`Invalid originator bank code: ${transaction.originatorBankCode}`);
    }

    if (!this.isValidBankCode(transaction.destinationBankCode)) {
      errors.push(`Invalid destination bank code: ${transaction.destinationBankCode}`);
    }

    // Validate account numbers
    if (!this.isValidAccountNumber(transaction.originatorAccount)) {
      errors.push(`Invalid originator account number: ${transaction.originatorAccount}`);
    }

    if (!this.isValidAccountNumber(transaction.destinationAccount)) {
      errors.push(`Invalid destination account number: ${transaction.destinationAccount}`);
    }

    // Validate amount
    if (!this.isValidAmount(transaction.amount)) {
      errors.push(`Invalid transaction amount: ${transaction.amount}`);
    }

    // Check for duplicate account numbers
    if (transaction.originatorAccount === transaction.destinationAccount) {
      errors.push('Originator and destination accounts cannot be the same');
    }

    // For high-value transactions, apply additional validation
    if (transaction.amount >= this.highValueTransactionThreshold) {
      Logger.warn(`High-value transaction detected: ${transaction.amount} IRR`, 'TransactionValidator');
      // Additional validation could be added here
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates a reference ID according to Shaparak standards
   * @param referenceId Reference ID to validate
   * @returns Whether the reference ID is valid
   */
  private isValidReferenceId(referenceId: string): boolean {
    // Reference ID should be alphanumeric and between 8-30 characters
    return /^[A-Za-z0-9-]{8,30}$/.test(referenceId);
  }

  /**
   * Validates a bank code against the list of active bank codes
   * @param bankCode Bank code to validate
   * @returns Whether the bank code is valid
   */
  private isValidBankCode(bankCode: string): boolean {
    return this.activeBankCodes.includes(bankCode);
  }

  /**
   * Validates an account number according to Iranian banking standards
   * @param accountNumber Account number to validate
   * @returns Whether the account number is valid
   */
  private isValidAccountNumber(accountNumber: string): boolean {
    // Iranian account numbers are typically 16 digits
    // Some banks use different formats, so we allow alphanumeric with some special chars
    return /^[A-Za-z0-9-]{10,26}$/.test(accountNumber);
  }

  /**
   * Validates a transaction amount
   * @param amount Amount to validate
   * @returns Whether the amount is valid
   */
  private isValidAmount(amount: number): boolean {
    // Amount must be positive and below maximum
    return amount > 0 && amount <= this.maxTransactionAmount;
  }

  /**
   * Checks if a transaction might be fraudulent based on various risk factors
   * @param transaction Transaction to check
   * @returns Risk assessment with score and factors
   */
  assessTransactionRisk(transaction: RecordTransactionDto): { riskScore: number; riskFactors: string[] } {
    const riskFactors: string[] = [];
    let riskScore = 0;

    // Check for high-value transaction
    if (transaction.amount >= this.highValueTransactionThreshold) {
      riskScore += 30;
      riskFactors.push('High-value transaction');
    }

    // Check if transaction is just below reporting threshold
    const reportingThreshold = this.configService.get<number>('REPORTING_THRESHOLD', 100000000); // 100M IRR
    if (transaction.amount >= reportingThreshold * 0.95 && transaction.amount < reportingThreshold) {
      riskScore += 40;
      riskFactors.push('Transaction amount just below reporting threshold');
    }

    // Check for unusual transaction time
    const transactionHour = new Date(transaction.transactionDate).getHours();
    if (transactionHour < 6 || transactionHour > 23) {
      riskScore += 15;
      riskFactors.push('Unusual transaction time');
    }

    // Check for missing merchant details in a commercial transaction
    if (transaction.metadata?.transactionType === 'COMMERCIAL' && 
        (!transaction.merchantId || !transaction.terminalId)) {
      riskScore += 25;
      riskFactors.push('Missing merchant details in commercial transaction');
    }

    // Log for high-risk transactions
    if (riskScore >= 50) {
      Logger.warn(`High-risk transaction detected: Score ${riskScore}`, 'TransactionValidator');
    }

    return {
      riskScore,
      riskFactors,
    };
  }

  /**
   * Validates the fee calculation for a transaction
   * @param transactionAmount Amount of the transaction
   * @param feeAmount Fee amount to validate
   * @returns Whether the fee is valid
   */
  validateTransactionFee(transactionAmount: number, feeAmount: number): boolean {
    // Calculate expected fee based on transaction amount
    const expectedFee = this.calculateTransactionFee(transactionAmount);
    
    // Allow for small rounding differences
    return Math.abs(feeAmount - expectedFee) < 0.01;
  }

  /**
   * Calculates the transaction fee according to CBI and Shaparak regulations
   * @param amount Transaction amount
   * @returns Calculated fee
   */
  calculateTransactionFee(amount: number): number {
    // Example fee structure:
    // - Transactions below 100,000 IRR: 500 IRR fixed fee
    // - Transactions between 100,000 and 1,000,000 IRR: 0.5% fee
    // - Transactions above 1,000,000 IRR: 0.5% up to 10,000 IRR max
    
    if (amount < 100000) {
      return 500; // Fixed fee for small transactions
    } else if (amount <= 1000000) {
      return amount * 0.005; // 0.5% fee
    } else {
      return Math.min(amount * 0.005, 10000); // 0.5% with 10,000 IRR cap
    }
  }

  /**
   * Checks if a bank code belongs to a participating bank in Shaparak
   * @param bankCode Bank code to check
   * @returns Whether the bank participates in Shaparak
   */
  isShaparakParticipant(bankCode: string): boolean {
    // In a real implementation, this would check against the current list of
    // banks participating in the Shaparak network from a database or configuration
    const shaparakParticipants = [
      BankCode.MELLI,
      BankCode.SEPAH,
      BankCode.MELLAT,
      BankCode.TEJARAT,
      BankCode.SADERAT,
      BankCode.KESHAVARZI,
      BankCode.MASKAN,
      BankCode.REFAH,
      BankCode.SAMAN,
      BankCode.PARSIAN,
      BankCode.PASARGAD,
      BankCode.EGHTESAD_NOVIN,
    ];
    
    return shaparakParticipants.includes(bankCode as BankCode);
  }
}