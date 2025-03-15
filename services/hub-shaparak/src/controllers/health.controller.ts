// controllers/health.controller.ts
import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Check service health' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service is healthy',
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Service is unhealthy',
  })
  async checkHealth() {
    try {
      // Test database connection
      await this.transactionRepository.query('SELECT 1');
      
      return {
        status: 'ok',
        service: 'hub-shaparak',
        timestamp: new Date(),
        details: {
          database: 'connected',
        },
      };
    } catch (error) {
      return {
        status: 'error',
        service: 'hub-shaparak',
        timestamp: new Date(),
        details: {
          database: 'disconnected',
          error: error.message,
        },
      };
    }
  }
}