// payment/dto/initiate-payment.dto.ts
import { IsNumber, IsString, IsOptional, IsObject, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiatePaymentDto {
  @ApiProperty({
    example: 1000000,
    description: 'Payment amount',
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    example: 'IRR',
    description: 'Currency code',
    required: false,
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    example: 'Payment for order #12345',
    description: 'Payment description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Merchant ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  merchantId?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Payment method ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  paymentMethodId?: string;

  @ApiProperty({
    example: 'https://example.com/callback',
    description: 'Callback URL after payment completion',
    required: false,
  })
  @IsOptional()
  @IsString()
  callbackUrl?: string;

  @ApiProperty({
    example: { orderId: '12345' },
    description: 'Additional metadata for the transaction',
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: any;
}
