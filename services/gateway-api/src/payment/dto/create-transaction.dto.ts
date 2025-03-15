// payment/dto/create-transaction.dto.ts
import { IsString, IsNumber, IsEnum, IsUUID, IsOptional, IsObject } from 'class-validator';
import { TransactionType } from '../enums/transaction-type.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';

export class CreateTransactionDto {
  @IsUUID()
  userId: string;

  @IsNumber()
  amount: number;

  @IsString()
  currency: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  merchantId?: string;

  @IsOptional()
  @IsUUID()
  paymentMethodId?: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @IsOptional()
  @IsObject()
  metadata?: any;
}