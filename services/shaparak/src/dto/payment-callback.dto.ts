// dto/payment-callback.dto.ts
import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PaymentCallbackDto {
  @ApiProperty({
    example: 'SPK-12345678',
    description: 'Reference ID returned from the payment gateway',
  })
  @IsString()
  referenceId: string;

  @ApiProperty({
    example: 'SUCCESS',
    description: 'Payment status',
  })
  @IsString()
  status: string;

  @ApiProperty({
    example: 'transaction-123',
    description: 'Original transaction ID',
  })
  @IsString()
  transactionId: string;

  @ApiProperty({
    example: { trackingCode: '987654321' },
    description: 'Additional data returned from the payment gateway',
    required: false,
  })
  @IsOptional()
  @IsObject()
  additionalData?: any;
}



