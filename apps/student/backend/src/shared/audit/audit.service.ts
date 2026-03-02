/**
 * Mindforge Backend — Audit Log Service (Task 2.2 update)
 *
 * Central audit logging for sensitive operations.
 * Now persists to the audit_log DB table via AuditLogRepository,
 * with a fallback to console-only logging if DB is unavailable.
 *
 * Architecture ref: §6 "audit security events (failed logins, lockouts)"
 * Security baseline: "Audit log service" on Day 1
 */

import { Injectable, Logger } from '@nestjs/common';
import { AuditLogRepository } from '../../database/repositories/audit-log.repository';

export interface AuditEntry {
  /** Unique request/event ID */
  requestId: string;
  /** Action type (e.g. 'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOCKOUT') */
  action: string;
  /** Pseudonymous student ID (no PII) */
  studentId?: string;
  /** IP address (for rate limiting context) */
  ip?: string;
  /** Additional metadata (no PII) */
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger('AuditLog');

  constructor(private readonly auditLogRepo: AuditLogRepository) {}

  /**
   * Record an audit event.
   * Persists to audit_log table and logs to console.
   * If DB write fails, still logs to console (never blocks caller).
   */
  async log(entry: AuditEntry): Promise<void> {
    const auditRecord = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    // Always log to structured console (no PII, no MPIN, no stack traces)
    this.logger.log(JSON.stringify(auditRecord));

    // Persist to DB (best-effort — don't let audit failure break the flow)
    try {
      await this.auditLogRepo.create({
        requestId: entry.requestId,
        action: entry.action,
        studentId: entry.studentId,
        ipAddress: entry.ip,
        metadata: entry.metadata,
      });
    } catch (err: any) {
      this.logger.warn(`Failed to persist audit entry: ${err.message}`);
    }
  }
}
