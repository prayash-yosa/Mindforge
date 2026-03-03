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
import { ClassEntity } from './class.entity';

@Entity('syllabus_documents')
@Index(['classId', 'subject'])
export class SyllabusDocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'class_id' })
  @Index()
  classId: string;

  @ManyToOne(() => ClassEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class: ClassEntity;

  @Column()
  subject: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'file_type' })
  fileType: string;

  @Column({ name: 'storage_path' })
  storagePath: string;

  @Column({ name: 'file_size_bytes', type: 'integer', default: 0 })
  fileSizeBytes: number;

  /** 'pending' | 'processing' | 'ready' | 'failed' */
  @Column({ type: 'varchar', default: 'pending' })
  @Index()
  status: string;

  @Column({ name: 'error_message', nullable: true })
  errorMessage: string;

  @Column({ name: 'uploaded_by' })
  uploadedBy: string;

  @Column({ name: 'class_date', type: 'date', nullable: true })
  classDate: string;

  @Column({ name: 'duration_minutes', type: 'integer', default: 60 })
  durationMinutes: number;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
