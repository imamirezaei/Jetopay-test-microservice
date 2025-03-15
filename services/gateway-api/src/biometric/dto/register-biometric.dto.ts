// biometric/dto/register-biometric.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterBiometricDto {
  @ApiProperty({
    example: '-----BEGIN PUBLIC KEY-----\nMIIBIj...',
    description: 'Public key for biometric authentication',
  })
  @IsString()
  @IsNotEmpty()
  publicKey: string;

  @ApiProperty({
    example: 'device-123',
    description: 'Unique device identifier',
  })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({
    example: 'iPhone 13 Pro',
    description: 'Human-readable device name',
  })
  @IsString()
  @IsNotEmpty()
  deviceName: string;
}



