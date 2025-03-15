// dto/request/record-transaction.dto.ts
import { 
    IsString, 
    IsNumber, 
    IsOptional, 
    IsObject, 
    IsDateString, 
    IsEnum, 
    Min, 
    MaxLength 
  } from 'class-validator';
  import { ApiProperty } from '@nestjs/swagger';
  import { BankCode } from '../../enums/bank-code.enum';
  
  export class RecordTransactionDto {
    @ApiProperty({
      example: { confirmationId: '123456', transactionCode: 'TC987654' },
      description: 'Additional verification data',
      required: false,
    })
    @IsOptional()
    @IsObject()
    additionalData?: Record<string, any>;
  }
  
 
  
  