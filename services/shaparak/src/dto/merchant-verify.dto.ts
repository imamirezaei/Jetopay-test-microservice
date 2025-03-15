// dto/merchant-verify.dto.ts
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MerchantVerifyDto {
  @ApiProperty({
    example: 'merchant-123',
    description: 'Merchant ID',
  })
  @IsString()
  merchantId: string;

  @ApiProperty({
    example: 'terminal-456',
    description: 'Terminal ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  terminalId?: string;
}