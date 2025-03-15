// payment/controllers/payment-method.controller.ts
import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    Delete,
    UseGuards,
    HttpCode,
    HttpStatus,
    NotFoundException,
  } from '@nestjs/common';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
  } from '@nestjs/swagger';
  import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
  import { PaymentMethodService } from '../services/payment-method.service';
  import { AddPaymentMethodDto } from '../dto/add-payment-method.dto';
  import { PaymentMethodResponseDto } from '../dto/payment-method-response.dto';
  import { GetUserId } from '../../users/decorators/get-user-id.decorator';
  
  @ApiTags('payment-methods')
  @Controller('payment-methods')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  export class PaymentMethodController {
    constructor(
      private readonly paymentMethodService: PaymentMethodService,
    ) {}
  
    @Get()
    @ApiOperation({ summary: 'Get all payment methods for the user' })
    @ApiResponse({
      status: 200,
      description: 'List of payment methods',
      type: [PaymentMethodResponseDto],
    })
    async getAllPaymentMethods(
      @GetUserId() userId: string,
    ): Promise<PaymentMethodResponseDto[]> {
      return this.paymentMethodService.getUserPaymentMethods(userId);
    }
  
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Add a new payment method' })
    @ApiResponse({
      status: 201,
      description: 'Payment method added successfully',
      type: PaymentMethodResponseDto,
    })
    async addPaymentMethod(
      @Body() addPaymentMethodDto: AddPaymentMethodDto,
      @GetUserId() userId: string,
    ): Promise<PaymentMethodResponseDto> {
      return this.paymentMethodService.addPaymentMethod(userId, addPaymentMethodDto);
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get payment method by ID' })
    @ApiResponse({
      status: 200,
      description: 'Payment method details',
      type: PaymentMethodResponseDto,
    })
    async getPaymentMethodById(
      @Param('id') id: string,
      @GetUserId() userId: string,
    ): Promise<PaymentMethodResponseDto> {
      const paymentMethod = await this.paymentMethodService.getPaymentMethodById(id);
  
      if (!paymentMethod || paymentMethod.userId !== userId) {
        throw new NotFoundException('Payment method not found');
      }
  
      return paymentMethod;
    }
  
    @Post(':id/default')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Set payment method as default' })
    @ApiResponse({
      status: 200,
      description: 'Payment method set as default',
      type: PaymentMethodResponseDto,
    })
    async setDefaultPaymentMethod(
      @Param('id') id: string,
      @GetUserId() userId: string,
    ): Promise<PaymentMethodResponseDto> {
      return this.paymentMethodService.setDefaultPaymentMethod(userId, id);
    }
  
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Remove a payment method' })
    @ApiResponse({
      status: 200,
      description: 'Payment method removed successfully',
    })
    async removePaymentMethod(
      @Param('id') id: string,
      @GetUserId() userId: string,
    ): Promise<{ success: boolean }> {
      const result = await this.paymentMethodService.removePaymentMethod(userId, id);
      
      if (!result) {
        throw new NotFoundException('Payment method not found');
      }
      
      return { success: true };
    }
  }
  