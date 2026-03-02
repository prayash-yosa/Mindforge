/**
 * Mindforge Backend — AI Usage Log Entity (Task 8.7)
 *
 * Architecture ref: §5.1 — "ai_usage_logs: student_id, feature_type,
 * model_used, tokens_used, latency_ms, retrieval stats, response_status, timestamp."
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AiFeatureType {
  HOMEWORK_GEN = 'homework_gen',
  QUIZ_GEN = 'quiz_gen',
  DOUBT = 'doubt',
  FEEDBACK = 'feedback',
  GRADING = 'grading',
}

export enum AiResponseStatus {
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  FALLBACK = 'fallback',
}

@Entity('ai_usage_logs')
@Index(['studentId', 'featureType'])
export class AiUsageLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'student_id', nullable: true })
  studentId: string;

  @Column({ name: 'feature_type', type: 'varchar' })
  featureType: AiFeatureType;

  @Column({ name: 'model_used' })
  modelUsed: string;

  @Column({ name: 'prompt_tokens', default: 0 })
  promptTokens: number;

  @Column({ name: 'completion_tokens', default: 0 })
  completionTokens: number;

  @Column({ name: 'total_tokens', default: 0 })
  totalTokens: number;

  @Column({ name: 'latency_ms', default: 0 })
  latencyMs: number;

  @Column({ name: 'retrieval_chunk_count', default: 0 })
  retrievalChunkCount: number;

  @Column({ name: 'retrieval_top_score', type: 'real', nullable: true })
  retrievalTopScore: number;

  @Column({ name: 'response_status', type: 'varchar', default: AiResponseStatus.ACCEPTED })
  responseStatus: AiResponseStatus;

  @Column({ name: 'rejection_reason', nullable: true })
  rejectionReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
