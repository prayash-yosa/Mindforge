import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Public } from '../../common/decorators/public.decorator';
import { MetricsService } from './metrics.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly metricsService: MetricsService,
  ) {}

  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'teacher-backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('live')
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('ready')
  async readiness() {
    const checks: Record<string, string> = {};
    try {
      if (this.dataSource.isInitialized) {
        checks.database = 'ok';
      } else {
        checks.database = 'not_initialized';
      }
    } catch {
      checks.database = 'error';
    }

    const allOk = Object.values(checks).every((v) => v === 'ok');
    return {
      status: allOk ? 'ok' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('metrics')
  metrics() {
    return this.metricsService.getSnapshot();
  }
}
