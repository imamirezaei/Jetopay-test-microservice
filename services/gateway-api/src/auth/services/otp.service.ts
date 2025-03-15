// auth/services/otp.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/services/users.service';
import { OtpCode } from '../entities/otp-code.entity';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(OtpCode)
    private otpRepository: Repository<OtpCode>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  async generateOtp(phoneNumber: string): Promise<void> {
    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Calculate expiry (5 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    
    // Store in database
    await this.otpRepository.save({
      phoneNumber,
      code: otpCode,
      expiresAt,
      attempts: 0,
    });
    
    // In a real implementation, this would send the OTP via SMS
    console.log(`[SMS SIMULATION] Sending OTP ${otpCode} to ${phoneNumber}`);
    
    // In a production environment, you would integrate with an SMS service
    // await this.smsService.sendOtp(phoneNumber, otpCode);
  }

  async verifyOtp(
    phoneNumber: string,
    code: string,
  ): Promise<{ verified: boolean; token?: string }> {
    // Find the latest OTP for the phone number
    const otp = await this.otpRepository.findOne({
      where: { phoneNumber },
      order: { createdAt: 'DESC' },
    });

    if (!otp || otp.code !== code || otp.expiresAt < new Date() || otp.verified) {
      // If OTP exists and not verified, increment attempts
      if (otp && !otp.verified) {
        otp.attempts += 1;
        
        // Invalidate after 3 failed attempts
        if (otp.attempts >= 3) {
          otp.invalidated = true;
        }
        
        await this.otpRepository.save(otp);
      }
      
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Mark OTP as verified
    otp.verified = true;
    await this.otpRepository.save(otp);

    // Find or create a user with this phone number
    let user = await this.usersService.findByPhone(phoneNumber);
    
    if (!user) {
      // Create a temporary user with phone verification
      user = await this.usersService.createWithPhone(phoneNumber);
    }

    // Generate a JWT token for the user
    const payload = {
      sub: user.id,
      phone: phoneNumber,
      verified: true,
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m'),
    });

    return { verified: true, token };
  }
}