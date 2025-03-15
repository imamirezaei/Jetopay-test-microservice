// biometric/biometric.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BiometricKey } from './entities/biometric-key.entity';
import { BiometricChallenge } from './entities/biometric-challenge.entity';
import { BiometricController } from './controllers/biometric.controller';
import { BiometricService } from './services/biometric.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BiometricKey, BiometricChallenge]),
  ],
  controllers: [BiometricController],
  providers: [BiometricService],
  exports: [BiometricService, TypeOrmModule],
})
export class BiometricModule {}