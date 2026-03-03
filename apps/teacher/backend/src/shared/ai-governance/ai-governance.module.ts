import { Global, Module } from '@nestjs/common';
import { AiAuditService } from './ai-audit.service';
import { AiRateLimiterService } from './ai-rate-limiter.service';
import { NumericalValidatorService } from './numerical-validator.service';

@Global()
@Module({
  providers: [AiAuditService, AiRateLimiterService, NumericalValidatorService],
  exports: [AiAuditService, AiRateLimiterService, NumericalValidatorService],
})
export class AiGovernanceModule {}
