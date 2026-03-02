/**
 * Mindforge Backend — Health Check Controller
 *
 * Provides health check endpoint for load balancer readiness/liveness probes.
 * No auth required.
 *
 * Checklist 1.1: "Health check endpoint for load balancer"
 */

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check for load balancer' })
  @ApiOkResponse({ description: 'Service is healthy' })
  check() {
    return {
      status: 'ok',
      service: 'mindforge-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
