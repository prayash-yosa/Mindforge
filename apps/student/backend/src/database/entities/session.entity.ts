/**
 * Mindforge Backend — Session Entity (Task 2.1)
 *
 * Architecture ref: §5.1 — "sessions: student_id, token_or_session_id,
 * device_info, created_at, expires_at."
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StudentEntity } from './student.entity';

@Entity('sessions')
@Index(['studentId'])
export class SessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => StudentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: StudentEntity;

  /** JWT token (hashed or truncated for lookup) */
  @Column({ type: 'text' })
  token: string;

  /** Device information (user-agent, platform) */
  @Column({ name: 'device_info', nullable: true })
  deviceInfo: string;

  /** IP address at session creation */
  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt: Date;

  /** Whether the session has been explicitly invalidated */
  @Column({ name: 'is_revoked', default: false })
  isRevoked: boolean;
}
