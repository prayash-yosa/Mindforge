/**
 * Mindforge Backend — Syllabus Metadata Entity (Task 2.1)
 *
 * Architecture ref: §5.1 — "syllabus_metadata: class, board, subject,
 * chapter, topic (normalized hierarchy)."
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('syllabus_metadata')
@Index(['class', 'board', 'subject'])
@Index(['class', 'board', 'subject', 'chapter'])
export class SyllabusMetadataEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Academic class (e.g. "8") */
  @Column()
  class: string;

  /** Education board (e.g. "CBSE") */
  @Column()
  board: string;

  /** Subject name (e.g. "Mathematics") */
  @Column()
  subject: string;

  /** Chapter name */
  @Column()
  chapter: string;

  /** Topic within chapter */
  @Column()
  topic: string;

  /** Ordering for display (chapter→topic) */
  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
