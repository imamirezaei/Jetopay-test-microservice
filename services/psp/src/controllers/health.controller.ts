import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Check service health' })
  check() {
    return {
      status: 'ok',
      service: 'PSP Service',
      timestamp: new Date().toISOString(),
    };
  }
}