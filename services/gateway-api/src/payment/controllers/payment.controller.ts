// payment/controllers/payment.controller.ts
import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    NotFoundException,
    BadRequestException,
  } from '@nestjs/common';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
  } from '@nestjs/swagger';
  import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
  import { PaymentService } from '../services/payment.service';
  import { TransactionService } from '../services/transaction.service';
  import { InitiatePaymentDto } from '../dto/initiate-payment.dto';
  import { TransactionResponseDto } from '../dto/transaction-response.dto';
  import { GetUserId } from '../../users/decorators/get-user-id.decorator';
  import { TransactionStatus } from '../enums/transaction-status.enum';
  import { TransactionType } from '../enums/transaction-type.enum';
  import { VerifyPaymentDto } from '../dto/verify-payment.dto';
  import { PaymentFilterDto } from '../dto/payment-filter.dto';
  
  @ApiTags('payments')
  @Controller('payments')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  export class PaymentController {
    constructor(
      private readonly paymentService: PaymentService,
      private readonly transactionService: TransactionService,
    ) {}
  
    @Post('initiate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Initiate a new payment' })
    @ApiResponse({
      status: 200,
      description: 'Payment initiated successfully',
      type: TransactionResponseDto,
    })
    async initiatePayment(
      @Body() initiatePaymentDto: InitiatePaymentDto,
      @GetUserId() userId: string,
    ): Promise<TransactionResponseDto> {
      return this.paymentService.initiatePayment(userId, initiatePaymentDto);
    }
  
    @Post('verify')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify a payment' })
    @ApiResponse({
      status: 200,
      description: 'Payment verification result',
      type: TransactionResponseDto,
    })
    async verifyPayment(
      @Body() verifyPaymentDto: VerifyPaymentDto,
      @GetUserId() userId: string,
    ): Promise<TransactionResponseDto> {
      return this.paymentService.verifyPayment(userId, verifyPaymentDto);
    }
  
    @Get('transactions')
    @ApiOperation({ summary: 'Get user transactions with pagination and filtering' })
    @ApiResponse({
      status: 200,
      description: 'List of transactions',
      type: [TransactionResponseDto],
    })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'status', required: false, enum: TransactionStatus })
    @ApiQuery({ name: 'type', required: false, enum: TransactionType })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    async getTransactions(
      @GetUserId() userId: string,
      @Query() filterDto: PaymentFilterDto,
    ): Promise<{ transactions: TransactionResponseDto[]; total: number; page: number; limit: number }> {
      return this.transactionService.getUserTransactions(userId, filterDto);
    }
  
    @Get('transactions/:id')
    @ApiOperation({ summary: 'Get transaction details by ID' })
    @ApiResponse({
      status: 200,
      description: 'Transaction details',
      type: TransactionResponseDto,
    })
    async getTransactionById(
      @Param('id') id: string,
      @GetUserId() userId: string,
    ): Promise<TransactionResponseDto> {
      const transaction = await this.transactionService.getTransactionById(id);
  
      if (!transaction || transaction.userId !== userId) {
        throw new NotFoundException('Transaction not found');
      }
  
      return transaction;
    }
  
    @Post('cancel/:id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Cancel a pending transaction' })
    @ApiResponse({
      status: 200,
      description: 'Transaction cancelled successfully',
      type: TransactionResponseDto,
    })
    async cancelTransaction(
      @Param('id') id: string,
      @GetUserId() userId: string,
    ): Promise<TransactionResponseDto> {
      const transaction = await this.transactionService.getTransactionById(id);
  
      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }
  
      if (transaction.userId !== userId) {
        throw new BadRequestException('You do not have permission to cancel this transaction');
      }
  
      if (transaction.status !== TransactionStatus.PENDING) {
        throw new BadRequestException('Only pending transactions can be cancelled');
      }
  
      return this.transactionService.updateTransactionStatus(
        id,
        TransactionStatus.CANCELLED,
        'Cancelled by user',
      );
    }
  
    @Get('summary')
    @ApiOperation({ summary: 'Get user payment summary statistics' })
    @ApiResponse({
      status: 200,
      description: 'Payment summary statistics',
    })
    async getPaymentSummary(
      @GetUserId() userId: string,
      @Query('startDate') startDate?: string,
      @Query('endDate') endDate?: string,
    ): Promise<any> {
      return this.transactionService.getPaymentSummary(userId, startDate, endDate);
    }
  }
  