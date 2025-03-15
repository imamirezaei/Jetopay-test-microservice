// dto/settlement.dto.ts
import { 
    IsString, 
    IsNumber, 
    IsOptional, 
    IsDateString, 
    IsEnum, 
    IsArray, 
    ValidateNested,
    IsUUID,
    Min
  } from 'class-validator';
  import { Type } from 'class-transformer';
  import { ApiProperty } from '@nestjs/swagger';
  import { SettlementStatus } from '../entities/settlement-batch.entity';
  
  export class SettlementTransactionDto {
    @ApiProperty({
      example: '550e8400-e29b-41d4-a716-446655440000',
      description: 'Transaction ID',
    })
    @IsUUID()
    transactionId: string;
  
    @ApiProperty({
      example: 'SHT1631234567890123',
      description: 'Transaction reference ID',
    })
    @IsString()
    referenceId: string;
  
    @ApiProperty({
      example: 100000,
      description: 'Transaction amount',
    })
    @IsNumber()
    @Min(0)
    amount: number;
  
    @ApiProperty({
      example: '055',
      description: 'Source bank code',
    })
    @IsString()
    sourceBankCode: string;
  
    @ApiProperty({
      example: '061',
      description: 'Destination bank code',
    })
    @IsString()
    destinationBankCode: string;
  }
  
  export class SettlementDto {
    @ApiProperty({
      example: 'BATCH20230815001',
      description: 'Batch number for settlement',
    })
    @IsString()
    batchNumber: string;
  
    @ApiProperty({
      example: '2023-08-15',
      description: 'Settlement date',
    })
    @IsDateString()
    settlementDate: string;
  
    @ApiProperty({
      example: SettlementStatus.PENDING,
      enum: SettlementStatus,
      description: 'Settlement status',
    })
    @IsEnum(SettlementStatus)
    status: SettlementStatus;
  
    @ApiProperty({
      type: [SettlementTransactionDto],
      description: 'Transactions in this settlement batch',
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SettlementTransactionDto)
    transactions: SettlementTransactionDto[];
  
    @ApiProperty({
      example: 1000000000,
      description: 'Total settlement amount',
    })
    @IsNumber()
    @Min(0)
    totalAmount: number;
  
    @ApiProperty({
      example: { '055': { totalAmount: 500000000, count: 5 } },
      description: 'Summary by bank',
      required: false,
    })
    @IsOptional()
    bankSummary?: Record<string, {
      totalAmount: number;
      count: number;
    }>;
  
    @ApiProperty({
      example: { priority: 'high', systemId: 'S123' },
      description: 'Additional metadata',
      required: false,
    })
    @IsOptional()
    metadata?: Record<string, any>;
  }
  
  export class SettlementResultDto {
    @ApiProperty({
      example: true,
      description: 'Whether the settlement was successful',
    })
    success: boolean;
  
    @ApiProperty({
      example: 'BATCH20230815001',
      description: 'Batch number',
    })
    batchNumber: string;
  
    @ApiProperty({
      example: SettlementStatus.COMPLETED,
      enum: SettlementStatus,
      description: 'Settlement status',
    })
    status: SettlementStatus;
  
    @ApiProperty({
      example: 100,
      description: 'Total number of transactions',
    })
    totalTransactions: number;
  
    @ApiProperty({
      example: 98,
      description: 'Number of successful transactions',
    })
    successfulTransactions: number;
  
    @ApiProperty({
      example: 2,
      description: 'Number of failed transactions',
    })
    failedTransactions: number;
  
    @ApiProperty({
      example: 'STLE20230815001',
      description: 'Settlement reference',
      required: false,
    })
    settlementReference?: string;
  
    @ApiProperty({
      example: 'Network timeout for some transactions',
      description: 'Reason for partial or full failure',
      required: false,
    })
    failureReason?: string;
  
    @ApiProperty({
      example: '2023-08-15T23:45:00Z',
      description: 'Completion time',
      required: false,
    })
    completedAt?: Date;
  }