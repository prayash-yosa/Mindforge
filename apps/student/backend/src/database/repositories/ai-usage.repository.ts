/**
 * Mindforge Backend — AI Usage Repository (Task 8.7)
 *
 * Insert and query ai_usage_logs for monitoring and cost tracking.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { AiUsageLogEntity, AiFeatureType, AiResponseStatus } from '../entities/ai-usage-log.entity';

export interface AiUsageInput {
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

export interface DailyTokenUsage {
  date: string;
  totalTokens: number;
  callCount: number;
}

@Injectable()
export class AiUsageRepository extends BaseRepository {
  constructor(
    @InjectRepository(AiUsageLogEntity)
    private readonly repo: Repository<AiUsageLogEntity>,
  ) {
    super('AiUsageRepository');
  }

  async log(input: AiUsageInput): Promise<AiUsageLogEntity> {
    return this.withErrorHandling(
      () => this.repo.save(this.repo.create(input)),
      'log',
    );
  }

  async getTokenUsageByStudent(studentId: string): Promise<{ totalTokens: number; callCount: number }> {
    const result = await this.withErrorHandling(
      () => this.repo.createQueryBuilder('l')
        .select('SUM(l.total_tokens)', 'totalTokens')
        .addSelect('COUNT(*)', 'callCount')
        .where('l.student_id = :studentId', { studentId })
        .getRawOne(),
      'getTokenUsageByStudent',
    );
    return {
      totalTokens: parseInt(result?.totalTokens ?? '0', 10),
      callCount: parseInt(result?.callCount ?? '0', 10),
    };
  }

  async getRejectionRate(): Promise<{ total: number; rejected: number; rate: number }> {
    const result = await this.withErrorHandling(
      () => this.repo.createQueryBuilder('l')
        .select('COUNT(*)', 'total')
        .addSelect(`SUM(CASE WHEN l.response_status = '${AiResponseStatus.REJECTED}' THEN 1 ELSE 0 END)`, 'rejected')
        .getRawOne(),
      'getRejectionRate',
    );
    const total = parseInt(result?.total ?? '0', 10);
    const rejected = parseInt(result?.rejected ?? '0', 10);
    return { total, rejected, rate: total > 0 ? rejected / total : 0 };
  }

  async getRecentLogs(limit = 50): Promise<AiUsageLogEntity[]> {
    return this.withErrorHandling(
      () => this.repo.find({ order: { createdAt: 'DESC' }, take: limit }),
      'getRecentLogs',
    );
  }
}
