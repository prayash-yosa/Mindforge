/**
 * Mindforge Backend — Attendance Entity (Task 2.1)
 *
 * Architecture ref: §5.1 — "attendance: student_id, date, status
 * (present/absent), source_label; optionally period/term."
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { StudentEntity } from './student.entity';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
}

@Entity('attendance')
@Unique(['studentId', 'date'])
@Index(['studentId', 'date'])
export class AttendanceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'student_id' })
  @Index()
  studentId: string;

  @ManyToOne(() => StudentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: StudentEntity;

  /** Date of attendance (YYYY-MM-DD) */
  @Column({ type: 'date' })
  @Index()
  date: string;

  /** Attendance status */
  @Column({ type: 'varchar' })
  status: AttendanceStatus;

  /** Source label (e.g. "ERP", "manual", "biometric") */
  @Column({ name: 'source_label', nullable: true })
  sourceLabel: string;

  /** Academic period (e.g. "Term 1", "2025-26") */
  @Column({ nullable: true })
  period: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
