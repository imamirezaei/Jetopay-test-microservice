// auth/controllers/auth.controller.ts
import {
    Controller,
    Post,
    Body,
    UseGuards,
    Get,
    Req,
    HttpCode,
    HttpStatus,
  } from '@nestjs/common';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
  } from '@nestjs/swagger';
  import { AuthGuard } from '@nestjs/passport';
  import { Public } from '../decorators/public.decorator';
  import { AuthService } from '../services/auth.service';
  import { LoginDto } from '../dto/login.dto';
  import { RegisterDto } from '../dto/register.dto';
  import { RefreshTokenDto } from '../dto/refresh-token.dto';
  import { LoginResponseDto } from '../dto/login-response.dto';
  
  @ApiTags('auth')
  @Controller('auth')
  export class AuthController {
    constructor(private readonly authService: AuthService) {}
  
    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({
      status: 201,
      description: 'User registration successful',
      type: LoginResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async register(@Body() registerDto: RegisterDto): Promise<LoginResponseDto> {
      return this.authService.register(registerDto);
    }
  
    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'User login' })
    @ApiResponse({
      status: 200,
      description: 'Login successful',
      type: LoginResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
      return this.authService.login(loginDto);
    }
  
    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({
      status: 200,
      description: 'Token refresh successful',
      type: LoginResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Invalid refresh token' })
    async refreshToken(
      @Body() refreshTokenDto: RefreshTokenDto,
    ): Promise<LoginResponseDto> {
      return this.authService.refreshToken(refreshTokenDto.refreshToken);
    }
  
    @Public()
    @Get('google')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Google OAuth login' })
    @ApiResponse({ status: 302, description: 'Google OAuth redirect' })
    googleLogin() {
      // This will trigger Google OAuth flow
    }
  
    @Public()
    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Google OAuth callback' })
    @ApiResponse({
      status: 200,
      description: 'Google login successful',
      type: LoginResponseDto,
    })
    async googleLoginCallback(@Req() req): Promise<LoginResponseDto> {
      return this.authService.validateOAuthLogin(req.user);
    }
  
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'User logout' })
    @ApiResponse({ status: 200, description: 'Logout successful' })
    @ApiBody({ type: RefreshTokenDto })
    async logout(@Body() refreshTokenDto: RefreshTokenDto): Promise<{ success: boolean }> {
      await this.authService.revokeRefreshToken(refreshTokenDto.refreshToken);
      return { success: true };
    }
  
    @Get('profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user profile' })
    @ApiResponse({ status: 200, description: 'User profile' })
    getProfile(@Req() req) {
      return req.user;
    }
  }