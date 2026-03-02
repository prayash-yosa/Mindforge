/**
 * Mindforge Backend — Teacher Material Chunk Entity (Task 8.2–8.3)
 *
 * Architecture ref: §5.1 — "teacher_material_chunks: id, material_id (FK),
 * chunk_text, chunk_index, embedding_vector (pgvector), syllabus_ref, created_at."
 *
 * In dev/SQLite mode, embedding_vector is stored as JSON text.
 * In production/PostgreSQL, this column uses pgvector.
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
import { TeacherMaterialEntity } from './teacher-material.entity';

@Entity('teacher_material_chunks')
@Index(['materialId', 'chunkIndex'])
@Index(['syllabusClass', 'syllabusSubject', 'syllabusChapter'])
export class TeacherMaterialChunkEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'material_id' })
  @Index()
  materialId: string;

  @ManyToOne(() => TeacherMaterialEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'material_id' })
  material: TeacherMaterialEntity;

  @Column({ name: 'chunk_text', type: 'text' })
  chunkText: string;

  @Column({ name: 'chunk_index', type: 'integer' })
  chunkIndex: number;

  /** Embedding stored as JSON text (SQLite) or pgvector (PostgreSQL) */
  @Column({ name: 'embedding_vector', type: 'text', nullable: true })
  embeddingVector: string;

  @Column({ name: 'syllabus_class' })
  syllabusClass: string;

  @Column({ name: 'syllabus_subject' })
  syllabusSubject: string;

  @Column({ name: 'syllabus_chapter', nullable: true })
  syllabusChapter: string;

  @Column({ name: 'syllabus_topic', nullable: true })
  syllabusTopic: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
