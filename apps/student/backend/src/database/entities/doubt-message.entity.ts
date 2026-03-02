/**
 * Mindforge Backend — Doubt Message Entity (Task 2.1)
 *
 * Individual messages within a doubt thread.
 * Roles: "student" (user question) or "ai" (AI response).
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
import { DoubtThreadEntity } from './doubt-thread.entity';

export enum MessageRole {
  STUDENT = 'student',
  AI = 'ai',
  SYSTEM = 'system',
}

@Entity('doubt_messages')
@Index(['threadId'])
export class DoubtMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'thread_id' })
  threadId: string;

  @ManyToOne(() => DoubtThreadEntity, (thread) => thread.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'thread_id' })
  thread: DoubtThreadEntity;

  /** Message role */
  @Column({ type: 'varchar' })
  role: MessageRole;

  /** Message content (text, may include markdown) */
  @Column({ type: 'text' })
  content: string;

  /** AI model used (for traceability) */
  @Column({ name: 'ai_model', nullable: true })
  aiModel: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
