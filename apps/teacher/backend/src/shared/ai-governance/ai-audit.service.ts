import { Injectable, Logger } from '@nestjs/common';

export interface AiCallRecord {
  id: string;
  operation: 'syllabus_ingestion' | 'quiz_generation' | 'offline_generation';
  model: string;
  teacherId: string; // hashed or anonymized for logs
  classId?: string;
  inputTokenEstimate: number;
  outputTokenEstimate: number;
  latencyMs: number;
  success: boolean;
  errorCode?: string;
  timestamp: Date;
}

@Injectable()
export class AiAuditService {
  private readonly logger = new Logger('AiAudit');
  private readonly recentCalls: AiCallRecord[] = [];
  private readonly MAX_RECORDS = 500;
  private callCount = 0;
  private errorCount = 0;
  private totalLatencyMs = 0;

  record(entry: Omit<AiCallRecord, 'id' | 'timestamp'>): void {
    const record: AiCallRecord = {
      ...entry,
      id: `ai-${Date.now()}-${++this.callCount}`,
      teacherId: this.anonymize(entry.teacherId),
      timestamp: new Date(),
    };

    this.totalLatencyMs += entry.latencyMs;
    if (!entry.success) this.errorCount++;

    this.recentCalls.push(record);
    if (this.recentCalls.length > this.MAX_RECORDS) {
      this.recentCalls.shift();
    }

    const logLine =
      `[${record.operation}] model=${record.model} latency=${record.latencyMs}ms success=${record.success}` +
      (record.errorCode ? ` error=${record.errorCode}` : '') +
      ` tokens~${record.inputTokenEstimate}/${record.outputTokenEstimate}`;

    if (record.success) {
      this.logger.log(logLine);
    } else {
      this.logger.warn(logLine);
    }
  }

  getStats() {
    return {
      totalCalls: this.callCount,
      totalErrors: this.errorCount,
      errorRate: this.callCount > 0 ? +(this.errorCount / this.callCount * 100).toFixed(2) : 0,
      avgLatencyMs: this.callCount > 0 ? Math.round(this.totalLatencyMs / this.callCount) : 0,
      recentCalls: this.recentCalls.slice(-20),
    };
  }

  private anonymize(id: string): string {
    if (!id) return 'anonymous';
    if (id.length <= 6) return id.substring(0, 2) + '***';
    return id.substring(0, 4) + '***' + id.substring(id.length - 2);
  }
}
