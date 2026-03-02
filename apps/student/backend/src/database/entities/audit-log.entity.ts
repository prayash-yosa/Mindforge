/**
 * Mindforge Backend — Audit Log Entity (Task 2.1)
 *
 * Architecture ref: §5.1 — "audit_log: sensitive operations
 * (login attempts, lockouts, data access) for security and compliance."
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_log')
@Index(['action'])
@Index(['studentId'])
@Index(['createdAt'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Unique request/event ID for correlation */
  @Column({ name: 'request_id' })
  requestId: string;

  /** Action type (e.g. LOGIN_SUCCESS, LOGIN_FAILURE, LOCKOUT) */
  @Column()
  action: string;

  /** Pseudonymous student ID (nullable — some events have no student) */
  @Column({ name: 'student_id', nullable: true })
  studentId: string;

  /** IP address (for rate limiting context) */
  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  /** Additional metadata (JSON — no PII) */
  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
