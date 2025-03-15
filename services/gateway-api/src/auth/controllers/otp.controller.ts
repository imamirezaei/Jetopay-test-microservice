// auth/controllers/otp.controller.ts
import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
  } from '@nestjs/common';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
  } from '@nestjs/swagger';
  import { Public } from '../decorators/public.decorator';
  import { OtpService } from '../services/otp.service';
  import { GenerateOtpDto } from '../dto/generate-otp.dto';
  import { VerifyOtpDto } from '../dto/verify-otp.dto';
  
  @ApiTags('auth')
  @Controller('auth/otp')
  export class OtpController {
    constructor(private readonly otpService: OtpService) {}
  
    @Public()
    @Post('generate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Generate OTP' })
    @ApiResponse({ status: 200, description: 'OTP generated successfully' })
    async generateOtp(@Body() generateOtpDto: GenerateOtpDto): Promise<{ success: boolean }> {
      await this.otpService.generateOtp(generateOtpDto.phoneNumber);
      return { success: true };
    }
  
    @Public()
    @Post('verify')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify OTP' })
    @ApiResponse({ status: 200, description: 'OTP verified successfully' })
    @ApiResponse({ status: 401, description: 'Invalid OTP' })
    async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto): Promise<{ verified: boolean; token?: string }> {
      return this.otpService.verifyOtp(verifyOtpDto.phoneNumber, verifyOtpDto.otpCode);
    }
  }
  