// controllers/interbank.controller.ts
import { 
    Controller, 
    Post, 
    Get, 
    Body, 
    Param, 
    Query,
    HttpStatus,
    HttpCode,
    BadRequestException,
  } from '@nestjs/common';
  import { 
    ApiTags, 
    ApiOperation, 
    ApiResponse, 
    ApiQuery, 
    ApiParam
  } from '@nestjs/swagger';
  import { InterbankService } from '../services/interbank.service';
  import { SettlementService } from '../services/settlement.service';
  import { InterbankTransferDto } from '../dto/interbank-transfer.dto';
  
  @ApiTags('shetab')
  @Controller('interbank')
  export class InterbankController {
    constructor(
      private readonly interbankService: InterbankService,
      private readonly settlementService: SettlementService,
    ) {}
  
    @Post('transfer')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Initiate an interbank transfer' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Transfer initiated successfully',
    })
    @ApiResponse({ 
      status: HttpStatus.BAD_REQUEST, 
      description: 'Invalid transfer details',
    })
    async initiateTransfer(@Body() transferDto: InterbankTransferDto) {
      return this.interbankService.initiateTransfer(transferDto);
    }
  
    @Get('transfer/:referenceId')
    @ApiOperation({ summary: 'Get status of an interbank transfer' })
    @ApiParam({ name: 'referenceId', description: 'Reference ID of the transfer' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Transfer status retrieved successfully',
    })
    @ApiResponse({ 
      status: HttpStatus.NOT_FOUND, 
      description: 'Transfer not found',
    })
    async getTransferStatus(@Param('referenceId') referenceId: string) {
      return this.interbankService.verifyTransfer(referenceId);
    }
  
    @Get('banks')
    @ApiOperation({ summary: 'Get list of all banks' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Banks retrieved successfully',
    })
    async getBanks() {
      // Retrieve all bank information
      const banks = await this.interbankService.getAllBanks();
      return { banks };
    }
  
    @Get('banks/:code')
    @ApiOperation({ summary: 'Get bank information by code' })
    @ApiParam({ name: 'code', description: 'Bank code' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Bank information retrieved successfully',
    })
    @ApiResponse({ 
      status: HttpStatus.NOT_FOUND, 
      description: 'Bank not found',
    })
    async getBankInfo(@Param('code') code: string) {
      const bankInfo = await this.interbankService.getBankInfo(code);
      
      if (!bankInfo) {
        throw new BadRequestException(`Bank with code ${code} not found`);
      }
      
      return bankInfo;
    }
  
    @Get('settlements')
    @ApiOperation({ summary: 'Get settlement batches' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'status', required: false })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Settlement batches retrieved successfully',
    })
    async getSettlements(
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
      @Query('status') status?: string,
    ) {
      return this.settlementService.getSettlementBatches(page, limit, status);
    }
  
    @Get('settlements/:batchId')
    @ApiOperation({ summary: 'Get settlement batch by ID' })
    @ApiParam({ name: 'ba