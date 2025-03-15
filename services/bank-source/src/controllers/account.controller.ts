import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    Query,
    BadRequestException,
    NotFoundException,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
  import { DestinationAccountService } from '../services/destination-account.service';
  import { TransferService } from '../services/transfer.service';
  import { AddDestinationAccountDto } from '../dto/add-destination-account.dto';
  import { AuthGuard } from '../guards/auth.guard';
  import { GetUserId } from '../decorators/get-user-id.decorator';
  
  @ApiTags('destination-account')
  @Controller('destination-accounts')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  export class DestinationAccountController {
    constructor(
      private readonly destinationAccountService: DestinationAccountService,
      private readonly transferService: TransferService,
    ) {}
  
    @Get()
    @ApiOperation({ summary: 'Get all destination accounts for the authenticated user' })
    @ApiResponse({ status: 200, description: 'List of destination accounts' })
    async getAccounts(@GetUserId() userId: string) {
      return this.destinationAccountService.getAccountsByUserId(userId);
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get destination account details by ID' })
    @ApiResponse({ status: 200, description: 'Account details' })
    @ApiResponse({ status: 404, description: 'Account not found' })
    async getAccountById(
      @Param('id') id: string,
      @GetUserId() userId: string,
    ) {
      const account = await this.destinationAccountService.getAccountById(id);
      
      if (!account) {
        throw new NotFoundException('Account not found');
      }
      
      // Verify ownership
      if (account.userId !== userId) {
        throw new BadRequestException('You do not have access to this account');
      }
      
      return account;
    }
  
    @Get(':id/transfers')
    @ApiOperation({ summary: 'Get transfers for a destination account' })
    @ApiResponse({ status: 200, description: 'List of transfers' })
    @ApiResponse({ status: 404, description: 'Account not found' })
    async getAccountTransfers(
      @Param('id') id: string,
      @GetUserId() userId: string,
      @Query('limit') limit: number = 10,
      @Query('offset') offset: number = 0,
      @Query('startDate') startDate?: string,
      @Query('endDate') endDate?: string,
    ) {
      const account = await this.destinationAccountService.getAccountById(id);
      
      if (!account) {
        throw new NotFoundException('Account not found');
      }
      
      // Verify ownership
      if (account.userId !== userId) {
        throw new BadRequestException('You do not have access to this account');
      }
      
      return this.transferService.getTransferHistory(
        id,
        limit,
        offset,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined,
      );
    }
  
    @Post()
    @ApiOperation({ summary: 'Add a new destination account' })
    @ApiResponse({ status: 201, description: 'Account added successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async addAccount(
      @Body() addAccountDto: AddDestinationAccountDto,
      @GetUserId() userId: string,
    ) {
      // Check if the account exists in the bank's system
      const validation = await this.destinationAccountService.validateAccount(
        addAccountDto.accountNumber,
        addAccountDto.bankCode,
      );
      
      if (!validation.valid) {
        throw new BadRequestException(`Invalid account: ${validation.message}`);
      }
      
      // Add the account to the user's destination accounts
      return this.destinationAccountService.addDestinationAccount(
        userId,
        addAccountDto.accountNumber,
        addAccountDto.bankCode,
        addAccountDto.accountName || validation.accountName || `Account ${addAccountDto.accountNumber.substr(-4)}`,
        addAccountDto.description,
      );
    }
  
    @Post(':id/verify')
    @ApiOperation({ summary: 'Verify a destination account' })
    @ApiResponse({ status: 200, description: 'Account verification status' })
    @ApiResponse({ status: 404, description: 'Account not found' })
    async verifyAccount(
      @Param('id') id: string,
      @GetUserId() userId: string,
    ) {
      const account = await this.destinationAccountService.getAccountById(id);
      
      if (!account) {
        throw new NotFoundException('Account not found');
      }
      
      // Verify ownership
      if (account.userId !== userId) {
        throw new BadRequestException('You do not have access to this account');
      }
      
      return this.destinationAccountService.verifyAccount(id);
    }
  }