// auth/controllers/biometric-verification.controller.ts
import {
    Controller,
    Post,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
  } from '@nestjs/common';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
  } from '@nestjs/swagger';
  import { BiometricVerificationService } from '../services/biometric-verification.service';
  import { RegisterBiometricDto } from '../dto/register-biometric.dto';
  import { VerifyBiometricDto } from '../dto/verify-biometric.dto';
  import { GetUserId } from '../../users/decorators/get-user-id.decorator';
  
  @ApiTags('biometric')
  @Controller('auth/biometric')
  @ApiBearerAuth()
  export class BiometricVerificationController {
    constructor(
      private readonly biometricVerificationService: BiometricVerificationService,
    ) {}
  
    @Post('register')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Register biometric key' })
    @ApiResponse({ status: 200, description: 'Biometric key registered successfully' })
    async registerBiometric(
      @Body() registerBiometricDto: RegisterBiometricDto,
      @GetUserId() userId: string,
    ): Promise<{ success: boolean }> {
      await this.biometricVerificationService.registerBiometricKey(
        userId,
        registerBiometricDto.publicKey,
        registerBiometricDto.deviceId,
      );
      return { success: true };
    }
  
    @Post('verify')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify biometric authentication' })
    @ApiResponse({ status: 200, description: 'Biometric verification successful' })
    @ApiResponse({ status: 401, description: 'Biometric verification failed' })
    async verifyBiometric(
      @Body() verifyBiometricDto: VerifyBiometricDto,
      @GetUserId() userId: string,
    ): Promise<{ verified: boolean }> {
      const verified = await this.biometricVerificationService.verifyBiometric(
        userId,
        verifyBiometricDto.signature,
        verifyBiometricDto.challenge,
        verifyBiometricDto.deviceId,
      );
      return { verified };
    }
  }
  