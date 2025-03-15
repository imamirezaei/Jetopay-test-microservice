// interfaces/transaction.interface.ts
import { TransactionStatus } from '../enums/transaction-status.enum';
import { BankCode } from '../enums/bank-code.enum';

export interface ITransaction {
  id: string;
  referenceId: string;
  transactionDate: Date;
  originatorBankCode: BankCode;
  destinationBankCode: BankCode;
  originatorAccount: string;
  destinationAccount: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  statusDetail?: string;
  verificationCode?: string;
  trackingCode?: string;
  merchantId?: string;
  terminalId?: string;
  retryCount: number;
  feeAmount: number;
  description?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILedgerEntry {
  id: string;
  transactionId: string;
  bankCode: BankCode;
  accountNumber: string;
  entryType: 'DEBIT' | 'CREDIT';
  amount: number;
  currency: string;
  entryDate: Date;
  description?: string;
  referenceId?: string;
  metadata?: any;
  createdAt: Date;
}

export interface ITransactionEvent {
  type: string;
  transactionId: string;
  referenceId: string;
  status: TransactionStatus;
  timestamp: Date;
  data?: any;
}