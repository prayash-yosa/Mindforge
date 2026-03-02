/**
 * Mindforge Backend — Question Entity (Task 2.1)
 *
 * Architecture ref: §5.1 — "questions: question bank (syllabus ref, type,
 * content, correct answer / rubric); linked to activities."
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
import { ActivityEntity } from './activity.entity';
import { SyllabusMetadataEntity } from './syllabus-metadata.entity';

export enum QuestionType {
  MCQ = 'mcq',
  SHORT_ANSWER = 'short_answer',
  LONG_ANSWER = 'long_answer',
  TRUE_FALSE = 'true_false',
  FILL_BLANK = 'fill_blank',
}

@Entity('questions')
export class QuestionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'activity_id' })
  @Index()
  activityId: string;

  @ManyToOne(() => ActivityEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity: ActivityEntity;

  /** Syllabus reference for this question */
  @Column({ name: 'syllabus_id', nullable: true })
  syllabusId: string;

  @ManyToOne(() => SyllabusMetadataEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'syllabus_id' })
  syllabus: SyllabusMetadataEntity;

  /** Question type */
  @Column({ type: 'varchar' })
  type: QuestionType;

  /** Question text (may contain markdown) */
  @Column({ type: 'text' })
  content: string;

  /** Options for MCQ (JSON array) */
  @Column({ type: 'simple-json', nullable: true })
  options: string[];

  /** Correct answer (for deterministic grading) */
  @Column({ name: 'correct_answer', type: 'text', nullable: true })
  correctAnswer: string;

  /** Rubric or scoring guide (for AI-assisted grading) */
  @Column({ type: 'text', nullable: true })
  rubric: string;

  /** Difficulty level (1–5) */
  @Column({ default: 3 })
  difficulty: number;

  /** Order within the activity */
  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
