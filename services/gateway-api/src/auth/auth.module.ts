import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { BiometricModule } from '../biometric/biometric.module';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { RefreshToken } from './entities/refresh-token.entity';
import { OtpService } from './services/otp.service';
import { OtpController } from './controllers/otp.controller';
import { BiometricVerificationService } from './services/biometric-verification.service';
import { BiometricVerificationController } from './controllers/biometric-verification.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRATION', '15m'),
        },
      }),
    }),
    UsersModule,
    BiometricModule,
  ],
  controllers: [
    AuthController,
    OtpController,
    BiometricVerificationController,
  ],
  providers: [
    AuthService,
    OtpService,
    BiometricVerificationService,
    JwtStrategy,
    LocalStrategy,
    RefreshTokenStrategy,
    GoogleStrategy,
  ],
  exports: [
    AuthService,
    JwtModule,
    OtpService,
    BiometricVerificationService,
  ],
})
export class AuthModule {}
