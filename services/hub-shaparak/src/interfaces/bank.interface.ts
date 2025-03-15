// interfaces/bank.interface.ts
import { BankCode } from '../enums/bank-code.enum';

export interface IBank {
  code: BankCode;
  name: string;
  isShetabMember: boolean;
  isShaparakMember: boolean;
  routingNumber?: string;
  swiftCode?: string;
  apiEndpoint?: string;
  isActive: boolean;
}

export interface IBankTransferRequest {
  sourceBank: BankCode;
  sourceAccount: string;
  destinationBank: BankCode;
  destinationAccount: string;
  amount: number;
  currency: string;
  referenceId: string;
  description?: string;
  metadata?: any;
}

export interface IBankTransferResponse {
  success: boolean;
  referenceId: string;
  bankReferenceId?: string;
  status: string;
  message?: string;
  timestamp: Date;
  metadata?: any;
}

export interface IVerifyTransferRequest {
  bankCode: BankCode;
  referenceId: string;
  bankReferenceId?: string;
  verificationCode?: string;
  metadata?: any;
}

export interface IVerifyTransferResponse {
  verified: boolean;
  referenceId: string;
  bankReferenceId?: string;
  status: string;
  message?: string;
  timestamp: Date;
  metadata?: any;
}