// controllers/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterbankTransaction } from '../entities/interbank-transaction.entity';
import { TransactionStatus } from '../enums/transaction-status.enum';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectRepository(InterbankTransaction)
    private readonly transactionRepository: Repository<InterbankTransaction>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Check service health' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async check() {
    try {
      // Check database connection by running a simple query
      await this.transactionRepository.count();

      // Return health status with additional metrics
      return {
        status: 'ok',
        service: 'Shetab Service',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        connections: {
          database: true,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        service: 'Shetab Service',
        timestamp: new Date().toISOString(),
        message: 'Database connection failed',
        error: error.message,
      };
    }
  }

  @Get('/metrics')
  @ApiOperation({ summary: 'Get service metrics' })
  @ApiResponse({ status: 200, description: 'Service metrics' })
  async getMetrics() {
    // Get transaction metrics
    const [
      pendingCount,
      processingCount,
      completedCount,
      failedCount
    ] = await Promise.all([
      this.transactionRepository.count({ where: { status: TransactionStatus.PENDING } }),
      this.transactionRepository.count({ where: { status: TransactionStatus.PROCESSING } }),
      this.transactionRepository.count({ where: { status: TransactionStatus.COMPLETED } }),
      this.transactionRepository.count({ where: { status: TransactionStatus.FAILED } }),
    ]);

    // Calculate success rate
    const totalCount = pendingCount + processingCount + completedCount + failedCount;
    const successRate = totalCount > 0 
      ? (completedCount / totalCount) * 100 
      : 0;

    return {
      status: 'ok',
      service: 'Shetab Service',
      timestamp: new Date().toISOString(),
      metrics: {
        transactions: {
          pending: pendingCount,
          processing: processingCount,
          completed: completedCount,
          failed: failedCount,
          total: totalCount,
          successRate: parseFloat(successRate.toFixed(2)),
        },
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
    };
  }
}