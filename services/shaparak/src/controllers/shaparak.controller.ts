// controllers/shaparak.controller.ts
import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    Query,
    Req,
    UnauthorizedException,
    BadRequestException,
  } from '@nestjs/common';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
  } from '@nestjs/swagger';
  import { ShaparakService } from '../services/shaparak.service';
  import { CardPaymentService } from '../services/card-payment.service';
  import { MerchantService } from '../services/merchant.service';
  import { InitiatePaymentDto } from '../dto/initiate-payment.dto';
  import { PaymentCallbackDto } from '../dto/payment-callback.dto';
  import { AuthGuard } from '../guards/auth.guard';
  import { MerchantGuard } from '../guards/merchant.guard';
  import { GetMerchantId } from '../decorators/get-merchant-id.decorator';
  
  @ApiTags('shaparak')
  @Controller('shaparak')
  export class ShaparakController {
    constructor(
      private readonly shaparakService: ShaparakService,
      private readonly cardPaymentService: CardPaymentService,
      private readonly merchantService: MerchantService,
    ) {}
  
    @Post('payments/initiate')
    @UseGuards(AuthGuard, MerchantGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Initiate a card payment' })
    @ApiResponse({ status: 200, description: 'Payment initiated successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async initiatePayment(
      @Body() initiatePaymentDto: InitiatePaymentDto,
      @GetMerchantId() merchantId: string,
    ) {
      return this.cardPaymentService.initiateCardPayment(
        initiatePaymentDto.transactionId,
        initiatePaymentDto.amount,
        initiatePaymentDto.currency,
        initiatePaymentDto.cardInfo,
        merchantId,
        initiatePaymentDto.callbackUrl,
      );
    }
  
    @Post('payments/callback')
    @ApiOperation({ summary: 'Payment gateway callback endpoint' })
    @ApiResponse({ status: 200, description: 'Payment verification' })
    async paymentCallback(
      @Body() callbackData: PaymentCallbackDto,
      @Req() request,
    ) {
      // Verify the request is coming from Shaparak
      // In a real implementation, we would verify IP, signature, etc.
      // For demo, we'll just process the callback
  
      try {
        // Process the payment callback
        const result = await this.cardPaymentService.processPaymentCallback(
          callbackData.referenceId,
          callbackData.status,
          callbackData.transactionId,
          callbackData.additionalData,
        );
  
        // Redirect to the original callback URL with the result
        // In a real implementation, this would redirect to the merchant's site
        return {
          success: result.success,
          referenceId: callbackData.referenceId,
          message: result.message,
        };
      } catch (error) {
        return {
          success: false,
          referenceId: callbackData.referenceId,
          message: error.message,
        };
      }
    }
  
    @Get('merchants/:merchantId/verify')
    @UseGuards(AuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Verify a merchant' })
    @ApiResponse({ status: 200, description: 'Merchant verification result' })
    @ApiResponse({ status: 404, description: 'Merchant not found' })
    async verifyMerchant(
      @Param('merchantId') merchantId: string,
      @Query('terminalId') terminalId?: string,
    ) {
      return this.merchantService.verifyMerchant(merchantId, terminalId);
    }
  
    @Get('payments/:referenceId/status')
    @UseGuards(AuthGuard, MerchantGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get payment status by reference ID' })
    @ApiResponse({ status: 200, description: 'Payment status' })
    @ApiResponse({ status: 404, description: 'Payment not found' })
    async getPaymentStatus(
      @Param('referenceId') referenceId: string,
      @GetMerchantId() merchantId: string,
    ) {
      const payment = await this.cardPaymentService.getPaymentStatus(referenceId);
      
      // Verify the merchant has access to this payment
      if (payment.merchantId !== merchantId) {
        throw new UnauthorizedException('You do not have access to this payment');
      }
      
      return payment;
    }
  
    @Get('cards/bin/:bin')
    @UseGuards(AuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Look up card bin information' })
    @ApiResponse({ status: 200, description: 'Card bin information' })
    @ApiResponse({ status: 400, description: 'Invalid bin' })
    async cardBinLookup(@Param('bin') bin: string) {
      // Validate bin format
      if (!/^\d{6}$/.test(bin)) {
        throw new BadRequestException('Bin must be a 6-digit number');
      }
      
      return this.shaparakService.cardBinLookup(bin);
    }
  }
  
 