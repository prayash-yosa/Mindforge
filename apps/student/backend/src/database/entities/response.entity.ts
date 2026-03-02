/**
 * Mindforge Backend — Response Entity (Task 2.1)
 *
 * Architecture ref: §5.1 — "responses: student_id, question_id, activity_id,
 * attempt payload, score, feedback_level, ai_conversation_ref."
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
import { ActivityEntity } from './activity.entity';
import { QuestionEntity } from './question.entity';

export enum FeedbackLevel {
  NONE = 'none',
  HINT = 'hint',
  APPROACH = 'approach',
  CONCEPT = 'concept',
  SOLUTION = 'solution',
}

@Entity('responses')
@Index(['studentId', 'activityId'])
@Index(['studentId', 'questionId'])
export class ResponseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'student_id' })
  @Index()
  studentId: string;

  @ManyToOne(() => StudentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: StudentEntity;

  @Column({ name: 'activity_id' })
  @Index()
  activityId: string;

  @ManyToOne(() => ActivityEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity: ActivityEntity;

  @Column({ name: 'question_id' })
  questionId: string;

  @ManyToOne(() => QuestionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: QuestionEntity;

  /** Student's answer (text or JSON for MCQ selection) */
  @Column({ type: 'text' })
  answer: string;

  /** Whether the answer was correct */
  @Column({ name: 'is_correct', nullable: true })
  isCorrect: boolean;

  /** Score for this response (0–100 or partial) */
  @Column({ type: 'real', nullable: true })
  score: number;

  /** Highest feedback level accessed */
  @Column({ name: 'feedback_level', type: 'varchar', default: FeedbackLevel.NONE })
  feedbackLevel: FeedbackLevel;

  /** Reference to AI conversation (for traceability) */
  @Column({ name: 'ai_conversation_ref', nullable: true })
  aiConversationRef: string;

  /** AI feedback text (cached from provider) */
  @Column({ name: 'ai_feedback', type: 'text', nullable: true })
  aiFeedback: string;

  /** Attempt number (1 = first attempt) */
  @Column({ name: 'attempt_number', default: 1 })
  attemptNumber: number;

  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt: Date;
}
