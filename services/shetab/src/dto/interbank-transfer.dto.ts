// interbank-transfer.dto.ts
import { IsString, IsNumber, IsOptional, Min, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class InterbankTransferDto {
  @ApiProperty({
    example: '100000',
    description: 'Transfer amount',
  })
  @IsNumber()
  @Min(1000)
  amount: number;

  @ApiProperty({
    example: '055',
    description: 'Source bank code',
  })
  @IsString()
  sourceBankCode: string;

  @ApiProperty({
    example: '1234567890123456',
    description: 'Source account number',
  })
  @IsString()
  sourceAccountNumber: string;

  @ApiProperty({
    example: '061',
    description: 'Destination bank code',
  })
  @IsString()
  destinationBankCode: string;

  @ApiProperty({
    example: '6543210987654321',
    description: 'Destination account number',
  })
  @IsString()
  destinationAccountNumber: string;

  @ApiProperty({
    example: 'Payment for invoice #12345',
    description: 'Transfer description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'tx-12345',
    description: 'Original transaction ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiProperty({
    example: { orderId: '12345' },
    description: 'Additional metadata',
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}