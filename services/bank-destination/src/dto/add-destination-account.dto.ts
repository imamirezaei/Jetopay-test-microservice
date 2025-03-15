import { IsString, IsOptional, IsNotEmpty, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddDestinationAccountDto {
  @ApiProperty({
    example: '1234567890',
    description: 'Bank account number',
  })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({
    example: 'TEJIR',
    description: 'Bank code',
  })
  @IsString()
  @IsNotEmpty()
  bankCode: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Account holder name',
    required: false,
  })
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiProperty({
    example: 'My friend\'s account',
    description: 'Description for this account',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: true,
    description: 'Mark as favorite',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;
}