/**
 * Mindforge Backend — AI Usage Logger Service (Task 8.7)
 *
 * Centralized logging for all AI interactions: orchestrator, grading, feedback, doubts.
 * Logs to ai_usage_logs table for monitoring, cost tracking, and quality alerts.
 */

import { Injectable, Logger } from '@nestjs/common';
import { AiUsageRepository, AiUsageInput } from '../../database/repositories/ai-usage.repository';
import { AiFeatureType, AiResponseStatus } from '../../database/entities/ai-usage-log.entity';

export { AiFeatureType, AiResponseStatus };

export interface LogAiCallInput {
  studentId?: string;
  featureType: AiFeatureType;
  modelUsed: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  retrievalChunkCount?: number;
  retrievalTopScore?: number;
  responseStatus: AiResponseStatus;
  rejectionReason?: string;
}

@Injectable()
export class AiUsageLoggerService {
  private readonly logger = new Logger(AiUsageLoggerService.name);

  constructor(private readonly usageRepo: AiUsageRepository) {}

  /** Log an AI call asynchronously (non-blocking) */
  async log(input: LogAiCallInput): Promise<void> {
    try {
      await this.usageRepo.log(input as AiUsageInput);
    } catch (err: any) {
      this.logger.error(`Failed to log AI usage: ${err.message}`);
    }
  }

  async getStudentUsage(studentId: string) {
    return this.usageRepo.getTokenUsageByStudent(studentId);
  }

  async getRejectionRate() {
    return this.usageRepo.getRejectionRate();
  }

  async getRecentLogs(limit = 50) {
    return this.usageRepo.getRecentLogs(limit);
  }
}
