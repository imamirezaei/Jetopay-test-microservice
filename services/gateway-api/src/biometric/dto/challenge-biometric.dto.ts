// biometric/dto/challenge-biometric.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChallengeBiometricDto {
  @ApiProperty({
    example: 'device-123',
    description: 'Unique device identifier',
  })
  @IsString()
  @IsNotEmpty()
  deviceId: string;
}