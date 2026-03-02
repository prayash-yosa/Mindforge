/**
 * Mindforge Backend — Activity Entity (Task 2.1)
 *
 * Architecture ref: §5.1 — "activities: homework/quiz/test instances
 * (student_id, type, syllabus ref, status, created_at, due_at)."
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StudentEntity } from './student.entity';
import { SyllabusMetadataEntity } from './syllabus-metadata.entity';

export enum ActivityType {
  HOMEWORK = 'homework',
  QUIZ = 'quiz',
  TEST = 'test',
  GAP_BRIDGE = 'gap_bridge',
}

export enum ActivityStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

@Entity('activities')
@Index(['studentId', 'status'])
@Index(['studentId', 'type'])
export class ActivityEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'student_id' })
  @Index()
  studentId: string;

  @ManyToOne(() => StudentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: StudentEntity;

  /** Activity type: homework, quiz, test, gap_bridge */
  @Column({ type: 'varchar' })
  type: ActivityType;

  /** Reference to syllabus topic */
  @Column({ name: 'syllabus_id', nullable: true })
  syllabusId: string;

  @ManyToOne(() => SyllabusMetadataEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'syllabus_id' })
  syllabus: SyllabusMetadataEntity;

  /** Display title (e.g. "Ch 5 — Quadratic Equations") */
  @Column()
  title: string;

  /** Status lifecycle */
  @Column({ type: 'varchar', default: ActivityStatus.PENDING })
  status: ActivityStatus;

  /** Total questions in this activity */
  @Column({ name: 'question_count', default: 0 })
  questionCount: number;

  /** Estimated time in minutes */
  @Column({ name: 'estimated_minutes', nullable: true })
  estimatedMinutes: number;

  /** Due date/time (nullable for practice activities) */
  @Column({ name: 'due_at', type: 'datetime', nullable: true })
  dueAt: Date;

  /** When the student started working on it */
  @Column({ name: 'started_at', type: 'datetime', nullable: true })
  startedAt: Date;

  /** When the student completed it */
  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt: Date;

  /** Score (0–100) after completion */
  @Column({ type: 'real', nullable: true })
  score: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
