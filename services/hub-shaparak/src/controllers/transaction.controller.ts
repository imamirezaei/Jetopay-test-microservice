// controllers/transaction.controller.ts
import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
    Logger,
  } from '@nestjs/common';
  import { 
    ApiTags, 
    ApiOperation, 
    ApiResponse, 
    ApiParam, 
    ApiQuery 
  } from '@nestjs/swagger';
  import { MessagePattern, Payload } from '@nestjs/microservices';
  import { TransactionService } from '../services/transaction.service';
  import { RecordTransactionDto } from '../dto/request/record-transaction.dto';
  import { VerifyTransactionDto } from '../dto/request/verify-transaction.dto';
  import { TransactionResponseDto } from '../dto/response/transaction-response.dto';
  import { LedgerResponseDto } from '../dto/response/ledger-response.dto';
  import { TransactionStatus } from '../enums/transaction-status.enum';
  
  @ApiTags('transactions')
  @Controller('transactions')
  export class TransactionController {
    private readonly logger = new Logger(TransactionController.name);
  
    constructor(private readonly transactionService: TransactionService) {}
  
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Record a new transaction' })
    @ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Transaction recorded successfully',
      type: TransactionResponseDto,
    })
    @ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid transaction data',
    })
    async recordTransaction(
      @Body() recordTransactionDto: RecordTransactionDto,
    ): Promise<TransactionResponseDto> {
      try {
        this.logger.log(`Recording new transaction with reference ID: ${recordTransactionDto.referenceId}`);
        return await this.transactionService.recordTransaction(recordTransactionDto);
      } catch (error) {
        this.logger.error(`Error recording transaction: ${error.message}`, error.stack);
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new InternalServerErrorException('Failed to record transaction');
      }
    }
  
    @Post('verify')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify a transaction' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Transaction verification result',
      type: TransactionResponseDto,
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Transaction not found',
    })
    async verifyTransaction(
      @Body() verifyTransactionDto: VerifyTransactionDto,
    ): Promise<TransactionResponseDto> {
      try {
        this.logger.log(`Verifying transaction with reference ID: ${verifyTransactionDto.referenceId}`);
        const result = await this.transactionService.verifyTransaction(verifyTransactionDto);
        if (!result) {
          throw new NotFoundException(`Transaction with reference ID ${verifyTransactionDto.referenceId} not found`);
        }
        return result;
      } catch (error) {
        this.logger.error(`Error verifying transaction: ${error.message}`, error.stack);
        if (error instanceof NotFoundException || error instanceof BadRequestException) {
          throw error;
        }
        throw new InternalServerErrorException('Failed to verify transaction');
      }
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get transaction by ID' })
    @ApiParam({ name: 'id', description: 'Transaction ID' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Transaction details',
      type: TransactionResponseDto,
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Transaction not found',
    })
    async getTransactionById(@Param('id') id: string): Promise<TransactionResponseDto> {
      const transaction = await this.transactionService.getTransactionById(id);
      if (!transaction) {
        throw new NotFoundException(`Transaction with ID ${id} not found`);
      }
      return transaction;
    }
  
    @Get('reference/:referenceId')
    @ApiOperation({ summary: 'Get transaction by reference ID' })
    @ApiParam({ name: 'referenceId', description: 'Transaction reference ID' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Transaction details',
      type: TransactionResponseDto,
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Transaction not found',
    })
    async getTransactionByReferenceId(
      @Param('referenceId') referenceId: string,
    ): Promise<TransactionResponseDto> {
      const transaction = await this.transactionService.getTransactionByReferenceId(referenceId);
      if (!transaction) {
        throw new NotFoundException(`Transaction with reference ID ${referenceId} not found`);
      }
      return transaction;
    }
  
    @Get()
    @ApiOperation({ summary: 'Get transactions with filtering' })
    @ApiQuery({ name: 'status', required: false, enum: TransactionStatus })
    @ApiQuery({ name: 'originatorBank', required: false })
    @ApiQuery({ name: 'destinationBank', required: false })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'List of transactions',
      type: [TransactionResponseDto],
    })
    async getTransactions(
      @Query('status') status?: TransactionStatus,
      @Query('originatorBank') originatorBank?: string,
      @Query('destinationBank') destinationBank?: string,
      @Query('startDate') startDate?: string,
      @Query('endDate') endDate?: string,
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
    ): Promise<{ transactions: TransactionResponseDto[]; total: number; page: number; limit: number }> {
      return this.transactionService.getTransactions({
        status,
        originatorBank,
        destinationBank,
        startDate,
        endDate,
        page,
        limit,
      });
    }
  
    @Get(':id/ledger')
    @ApiOperation({ summary: 'Get ledger entries for a transaction' })
    @ApiParam({ name: 'id', description: 'Transaction ID' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Ledger entries for the transaction',
      type: [LedgerResponseDto],
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Transaction not found',
    })
    async getLedgerEntriesForTransaction(
      @Param('id') id: string,
    ): Promise<LedgerResponseDto[]> {
      const ledgerEntries = await this.transactionService.getLedgerEntriesForTransaction(id);
      if (!ledgerEntries) {
        throw new NotFoundException(`Transaction with ID ${id} not found`);
      }
      return ledgerEntries;
    }
  
    // Microservice message patterns
    @MessagePattern('record_transaction')
    async handleRecordTransaction(
      @Payload() recordTransactionDto: RecordTransactionDto,
    ): Promise<TransactionResponseDto> {
      this.logger.log(`[MS] Recording transaction with reference ID: ${recordTransactionDto.referenceId}`);
      return this.transactionService.recordTransaction(recordTransactionDto);
    }
  
    @MessagePattern('verify_transaction')
    async handleVerifyTransaction(
      @Payload() verifyTransactionDto: VerifyTransactionDto,
    ): Promise<TransactionResponseDto> {
      this.logger.log(`[MS] Verifying transaction with reference ID: ${verifyTransactionDto.referenceId}`);
      return this.transactionService.verifyTransaction(verifyTransactionDto);
    }
  
    @MessagePattern('get_transaction_by_reference')
    async handleGetTransactionByReference(
      @Payload() payload: { referenceId: string },
    ): Promise<TransactionResponseDto> {
      this.logger.log(`[MS] Getting transaction with reference ID: ${payload.referenceId}`);
      return this.transactionService.getTransactionByReferenceId(payload.referenceId);
    }
  }
  