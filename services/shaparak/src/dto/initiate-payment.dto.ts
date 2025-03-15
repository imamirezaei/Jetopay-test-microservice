// dto/initiate-payment.dto.ts
import { IsString, IsNumber, IsOptional, IsObject, Min, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class CardInfoDto {
  @ApiProperty({
    example: '4111111111111111',
    description: 'Card number',
    required: false,
  })
  @IsOptional()
  @IsString()
  cardNumber?: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Card holder name',
    required: false,
  })
  @IsOptional()
  @IsString()
  holderName?: string;

  @ApiProperty({
    example: '12',
    description: 'Card expiry month (2 digits)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  expiryMonth?: string;

  @ApiProperty({
    example: '25',
    description: 'Card expiry year (2 digits)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  expiryYear?: string;

  @ApiProperty({
    example: '123',
    description: 'Card CVV code',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4)
  cvv?: string;
}

export class InitiatePaymentDto {
  @ApiProperty({
    example: 'transaction-123',
    description: 'Unique transaction ID',
  })
  @IsString()
  transactionId: string;

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
    default: 'IRR',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    description: 'Card information',
    type: CardInfoDto,
    required: false,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CardInfoDto)
  cardInfo?: CardInfoDto;

  @ApiProperty({
    example: 'https://example.com/callback',
    description: 'Callback URL for the payment gateway',
  })
  @IsString()
  callbackUrl: string;

  @ApiProperty({
    example: 'Payment for order #12345',
    description: 'Payment description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
