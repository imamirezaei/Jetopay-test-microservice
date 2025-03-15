// payment/dto/verify-payment.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPaymentDto {
  @ApiProperty({
    example: 'ref-123456789',
    description: 'Reference ID returned from the payment gateway',
  })
  @IsString()
  @IsNotEmpty()
  referenceId: string;

  @ApiProperty({
    example: { trackingCode: '987654321' },
    description: 'Additional data returned from the payment gateway',
    required: false,
  })
  @IsOptional()
  @IsObject()
  additionalData?: any;
}