import { Global, Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { IntegrationHealthController } from './integration-health.controller';
import { MetricsService } from './metrics.service';

@Global()
@Module({
  controllers: [HealthController, IntegrationHealthController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class HealthModule {}
