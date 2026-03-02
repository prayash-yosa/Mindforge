/**
 * Mindforge Backend — Teacher Material Entity (Task 8.1)
 *
 * Architecture ref: §5.1 — "teacher_materials: id, teacher_id, class,
 * subject, file_name, file_type, storage_path, status, uploaded_at."
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MaterialStatus {
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

@Entity('teacher_materials')
@Index(['teacherId', 'syllabusClass', 'syllabusSubject'])
export class TeacherMaterialEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'teacher_id' })
  @Index()
  teacherId: string;

  @Column({ name: 'syllabus_class' })
  syllabusClass: string;

  @Column({ name: 'syllabus_subject' })
  syllabusSubject: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'file_type' })
  fileType: string;

  @Column({ name: 'storage_path' })
  storagePath: string;

  @Column({ type: 'varchar', default: MaterialStatus.PROCESSING })
  status: MaterialStatus;

  @Column({ name: 'chunk_count', default: 0 })
  chunkCount: number;

  @Column({ name: 'error_message', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
