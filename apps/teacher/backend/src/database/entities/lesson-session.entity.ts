import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SyllabusDocumentEntity } from './syllabus-document.entity';
import { ClassEntity } from './class.entity';

@Entity('lesson_sessions')
@Index(['classId', 'subject'])
export class LessonSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'syllabus_document_id' })
  @Index()
  syllabusDocumentId: string;

  @ManyToOne(() => SyllabusDocumentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'syllabus_document_id' })
  syllabusDocument: SyllabusDocumentEntity;

  @Column({ name: 'class_id' })
  @Index()
  classId: string;

  @ManyToOne(() => ClassEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class: ClassEntity;

  @Column()
  subject: string;

  @Column({ name: 'concept_summary', type: 'text' })
  conceptSummary: string;

  @Column({ name: 'learning_objectives', type: 'text' })
  learningObjectives: string;

  @Column({ name: 'has_numericals', default: false })
  hasNumericals: boolean;

  @Column({ type: 'text', nullable: true })
  chapters: string;

  @Column({ type: 'text', nullable: true })
  topics: string;

  @Column({ name: 'raw_text', type: 'text', nullable: true })
  rawText: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
