/**
 * Mindforge Backend — Doubt Thread Entity (Task 2.1)
 *
 * Architecture ref: §5.1 — "doubt_threads: student_id, syllabus context
 * (class, subject, chapter, topic), messages (role, content), created_at."
 *
 * Messages are stored in a separate DoubtMessage entity for normalization.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { StudentEntity } from './student.entity';
import { DoubtMessageEntity } from './doubt-message.entity';

@Entity('doubt_threads')
@Index(['studentId'])
export class DoubtThreadEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => StudentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: StudentEntity;

  /** Syllabus context — Class */
  @Column({ name: 'syllabus_class', nullable: true })
  syllabusClass: string;

  /** Syllabus context — Subject */
  @Column({ name: 'syllabus_subject', nullable: true })
  syllabusSubject: string;

  /** Syllabus context — Chapter */
  @Column({ name: 'syllabus_chapter', nullable: true })
  syllabusChapter: string;

  /** Syllabus context — Topic */
  @Column({ name: 'syllabus_topic', nullable: true })
  syllabusTopic: string;

  /** Thread title (generated from first message or context) */
  @Column({ nullable: true })
  title: string;

  /** Whether the thread is resolved */
  @Column({ name: 'is_resolved', default: false })
  isResolved: boolean;

  @OneToMany(() => DoubtMessageEntity, (msg) => msg.thread, { cascade: true })
  messages: DoubtMessageEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
