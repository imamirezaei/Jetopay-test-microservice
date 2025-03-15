// payment/dto/add-payment-method.dto.ts
import { IsString, IsEnum, IsOptional, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethodType } from '../enums/payment-method-type.enum';

export class AddPaymentMethodDto {
  @ApiProperty({
    enum: PaymentMethodType,
    example: PaymentMethodType.CARD,
    description: 'Type of payment method',
  })
  @IsEnum(PaymentMethodType)
  type: PaymentMethodType;

  @ApiProperty({
    example: '4111111111111111',
    description: 'Card number (required for CARD type)',
    required: false,
  })
  @IsOptional()
  @IsString()
  cardNumber?: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Card holder name (required for CARD type)',
    required: false,
  })
  @IsOptional()
  @IsString()
  cardHolderName?: string;

  @ApiProperty({
    example: '12/25',
    description: 'Card expiration date in MM/YY format (required for CARD type)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, {
    message: 'Expiration date must be in MM/YY format',
  })
  expirationDate?: string;

  @ApiProperty({
    example: 'token-123456',
    description: 'Token for tokenized payment methods',
    required: false,
  })
  @IsOptional()
  @IsString()
  token?: string;

  @ApiProperty({
    example: 'My Personal Card',
    description: 'Nickname for the payment method',
    required: false,
  })
  @IsOptional()
  @IsString()
  nickname?: string;
}