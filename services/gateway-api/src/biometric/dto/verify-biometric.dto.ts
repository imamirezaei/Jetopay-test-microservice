// biometric/dto/verify-biometric.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyBiometricDto {
  @ApiProperty({
    example: 'base64-encoded-signature',
    description: 'Signature created by signing the challenge with the private key',
  })
  @IsString()
  @IsNotEmpty()
  signature: string;

  @ApiProperty({
    example: '1a2b3c4d...',
    description: 'Challenge to sign',
  })
  @IsString()
  @IsNotEmpty()
  challenge: string;

  @ApiProperty({
    example: 'device-123',
    description: 'Unique device identifier',
  })
  @IsString()
  @IsNotEmpty()
  deviceId: string;
}