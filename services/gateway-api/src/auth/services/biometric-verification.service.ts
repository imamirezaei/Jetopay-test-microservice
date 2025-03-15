// auth/services/biometric-verification.service.ts
import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { BiometricKey } from '../../biometric/entities/biometric-key.entity';
import { BiometricChallenge } from '../../biometric/entities/biometric-challenge.entity';

@Injectable()
export class BiometricVerificationService {
  constructor(
    @InjectRepository(BiometricKey)
    private biometricKeyRepository: Repository<BiometricKey>,
    @InjectRepository(BiometricChallenge)
    private biometricChallengeRepository: Repository<BiometricChallenge>,
    private configService: ConfigService,
  ) {}

  async registerBiometricKey(
    userId: string,
    publicKey: string,
    deviceId: string,
  ): Promise<void> {
    // Check if there's already a key for this device
    let biometricKey = await this.biometricKeyRepository.findOne({
      where: { userId, deviceId },
    });

    // If key exists, update it; otherwise create a new one
    if (biometricKey) {
      biometricKey.publicKey = publicKey;
      biometricKey.updatedAt = new Date();
    } else {
      biometricKey = this.biometricKeyRepository.create({
        userId,
        deviceId,
        publicKey,
      });
    }

    await this.biometricKeyRepository.save(biometricKey);
  }

  async createChallenge(userId: string, deviceId: string): Promise<string> {
    // Generate a random challenge
    const challenge = crypto.randomBytes(32).toString('hex');
    
    // Save challenge to database
    await this.biometricChallengeRepository.save({
      userId,
      deviceId,
      challenge,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
    });
    
    return challenge;
  }

  async verifyBiometric(
    userId: string,
    signature: string,
    challenge: string,
    deviceId: string,
  ): Promise<boolean> {
    // Fetch the user's biometric key for the device
    const biometricKey = await this.biometricKeyRepository.findOne({
      where: { userId, deviceId },
    });

    if (!biometricKey) {
      throw new NotFoundException('Biometric key not found for this device');
    }

    // Fetch the challenge
    const challengeRecord = await this.biometricChallengeRepository.findOne({
      where: { userId, deviceId, challenge },
    });

    if (!challengeRecord || challengeRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired challenge');
    }

    // Verify the signature
    try {
      const publicKey = crypto.createPublicKey(biometricKey.publicKey);
      const verified = crypto.verify(
        'sha256',
        Buffer.from(challenge),
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        },
        Buffer.from(signature, 'base64'),
      );

      // Delete the used challenge regardless of verification result
      await this.biometricChallengeRepository.remove(challengeRecord);

      return verified;
    } catch (error) {
      throw new UnauthorizedException('Biometric verification failed');
    }
  }

  async removeAllUserKeys(userId: string): Promise<void> {
    await this.biometricKeyRepository.delete({ userId });
  }

  async removeDeviceKey(userId: string, deviceId: string): Promise<void> {
    await this.biometricKeyRepository.delete({ userId, deviceId });
  }
}