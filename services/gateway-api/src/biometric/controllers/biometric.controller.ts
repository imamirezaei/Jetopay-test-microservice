// biometric/controllers/biometric.controller.ts
import {
    Controller,
    Post,
    Get,
    Body,
    Delete,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
    UnauthorizedException,
    NotFoundException,
  } from '@nestjs/common';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
  } from '@nestjs/swagger';
  import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
  import { BiometricService } from '../services/biometric.service';
  import { GetUserId } from '../../users/decorators/get-user-id.decorator';
  import { RegisterBiometricDto } from '../dto/register-biometric.dto';
  import { ChallengeBiometricDto } from '../dto/challenge-biometric.dto';
  import { VerifyBiometricDto } from '../dto/verify-biometric.dto';
  import { BiometricKeyResponseDto } from '../dto/biometric-key-response.dto';
  
  @ApiTags('biometric')
  @Controller('biometric')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  export class BiometricController {
    constructor(private readonly biometricService: BiometricService) {}
  
    @Get('keys')
    @ApiOperation({ summary: 'Get all biometric keys for the user' })
    @ApiResponse({
      status: 200,
      description: 'List of biometric keys',
      type: [BiometricKeyResponseDto],
    })
    async getAllKeys(@GetUserId() userId: string): Promise<BiometricKeyResponseDto[]> {
      return this.biometricService.getAllKeys(userId);
    }
  
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Register a new biometric key' })
    @ApiResponse({
      status: 201,
      description: 'Biometric key registered successfully',
      type: BiometricKeyResponseDto,
    })
    async registerBiometric(
      @Body() registerBiometricDto: RegisterBiometricDto,
      @GetUserId() userId: string,
    ): Promise<BiometricKeyResponseDto> {
      return this.biometricService.registerBiometricKey(
        userId,
        registerBiometricDto.publicKey,
        registerBiometricDto.deviceId,
        registerBiometricDto.deviceName,
      );
    }
  
    @Post('challenge')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Generate a challenge for biometric authentication' })
    @ApiResponse({
      status: 200,
      description: 'Challenge generated successfully',
      type: Object,
    })
    async generateChallenge(
      @Body() challengeBiometricDto: ChallengeBiometricDto,
      @GetUserId() userId: string,
    ): Promise<{ challenge: string }> {
      const challenge = await this.biometricService.createChallenge(
        userId,
        challengeBiometricDto.deviceId,
      );
      return { challenge };
    }
  
    @Post('verify')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify biometric authentication' })
    @ApiResponse({
      status: 200,
      description: 'Biometric verification successful',
      type: Object,
    })
    @ApiResponse({ status: 401, description: 'Biometric verification failed' })
    async verifyBiometric(
      @Body() verifyBiometricDto: VerifyBiometricDto,
      @GetUserId() userId: string,
    ): Promise<{ verified: boolean }> {
      const verified = await this.biometricService.verifyBiometric(
        userId,
        verifyBiometricDto.signature,
        verifyBiometricDto.challenge,
        verifyBiometricDto.deviceId,
      );
      
      if (!verified) {
        throw new UnauthorizedException('Biometric verification failed');
      }
      
      return { verified: true };
    }
  
    @Delete('keys/:deviceId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Remove a biometric key for a device' })
    @ApiResponse({
      status: 200,
      description: 'Biometric key removed successfully',
    })
    async removeDeviceKey(
      @Param('deviceId') deviceId: string,
      @GetUserId() userId: string,
    ): Promise<{ success: boolean }> {
      const result = await this.biometricService.removeDeviceKey(userId, deviceId);
      if (!result) {
        throw new NotFoundException('Biometric key not found');
      }
      return { success: true };
    }
  
    @Delete('keys')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Remove all biometric keys for the user' })
    @ApiResponse({
      status: 200,
      description: 'All biometric keys removed successfully',
    })
    async removeAllKeys(
      @GetUserId() userId: string,
    ): Promise<{ success: boolean }> {
      await this.biometricService.removeAllUserKeys(userId);
      return { success: true };
    }
  }