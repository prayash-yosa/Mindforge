/**
 * Mindforge Backend — Teaching Feed Entity (Task 2.1)
 *
 * Architecture ref: §5.1 — "teaching_feed: ingested NotebookLM daily summaries
 * (class, date, summary, key points)."
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('teaching_feed')
@Index(['class', 'date'])
export class TeachingFeedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Academic class this feed is for */
  @Column()
  class: string;

  /** Board (optional — may be class-wide) */
  @Column({ nullable: true })
  board: string;

  /** Subject covered */
  @Column({ nullable: true })
  subject: string;

  /** Date of the teaching session */
  @Column({ type: 'date' })
  @Index()
  date: string;

  /** Summary text from NotebookLM */
  @Column({ type: 'text' })
  summary: string;

  /** Key points (JSON array of strings) */
  @Column({ type: 'simple-json', nullable: true })
  keyPoints: string[];

  /** Source reference (NotebookLM ID or URL) */
  @Column({ name: 'source_ref', nullable: true })
  sourceRef: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
