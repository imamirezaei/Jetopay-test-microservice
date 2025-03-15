import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkAccountDto {
  @ApiProperty({
    example: '1234567890',
    description: 'Bank account number',
  })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({
    example: 'TEJARAT',
    description: 'Bank code',
  })
  @IsString()
  @IsNotEmpty()
  bankCode: string;

  @ApiProperty({
    example: '6104337812345678',
    description: 'Card number associated with the account',
    required: false,
  })
  @IsOptional()
  @IsString()
  cardNumber?: string;

  @ApiProperty({
    example: 'My Savings Account',
    description: 'Custom name for the account',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;
}