// payment/dto/update-transaction.dto.ts
import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { TransactionStatus } from '../enums/transaction-status.enum';

export class UpdateTransactionDto {
  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  gatewayUrl?: string;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @IsString()
  statusDetail?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}
