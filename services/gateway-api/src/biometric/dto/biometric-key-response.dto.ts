// biometric/dto/biometric-key-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class BiometricKeyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  deviceId: string;

  @ApiProperty()
  deviceName: string;

  @ApiProperty()
  keyType: string;

  @ApiProperty({ nullable: true })
  lastUsed?: Date;

  @ApiProperty()
  createdAt: Date;
}