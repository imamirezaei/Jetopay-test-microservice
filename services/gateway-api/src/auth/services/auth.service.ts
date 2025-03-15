// auth/services/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../../users/services/users.service';
import { User } from '../../users/entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { LoginResponseDto } from '../dto/login-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.generateTokens(user);
  }

  async register(registerDto: RegisterDto): Promise<LoginResponseDto> {
    // Check if email is already in use
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Check if phone is already in use
    const existingPhone = await this.usersService.findByPhone(registerDto.phoneNumber);
    if (existingPhone) {
      throw new ConflictException('Phone number already in use');
    }

    // Create new user
    const user = await this.usersService.create(registerDto);
    return this.generateTokens(user);
  }

  async validateOAuthLogin(profile: any): Promise<LoginResponseDto> {
    let user = await this.usersService.findByEmail(profile.email);

    if (!user) {
      // Create new user from OAuth profile
      user = await this.usersService.createFromOAuth(profile);
    }

    return this.generateTokens(user);
  }

  async refreshToken(token: string): Promise<LoginResponseDto> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token, revoked: false },
      relations: ['user'],
    });

    if (!refreshToken || new Date() > refreshToken.expiresAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { user } = refreshToken;
    
    // Revoke the old refresh token
    await this.revokeRefreshToken(token);
    
    // Generate new tokens
    return this.generateTokens(user);
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { token },
      { revoked: true },
    );
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, revoked: false },
      { revoked: true },
    );
  }

  private async generateTokens(user: User): Promise<LoginResponseDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    const accessToken = this.jwtService.sign(payload);
    
    // Generate refresh token
    const refreshToken = uuidv4();
    
    // Calculate expiry date based on config
    const refreshExpiration = this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d');
    const expiresIn = this.parseExpiration(refreshExpiration);
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
    
    // Save refresh token to database
    await this.refreshTokenRepository.save({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiration(this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m')),
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
      },
    };
  }

  private parseExpiration(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 900; // Default: 15 minutes in seconds
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 900;
    }
  }
}
