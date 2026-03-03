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
import { LessonSessionEntity } from './lesson-session.entity';

@Entity('test_definitions')
@Index(['classId', 'subject', 'mode'])
export class TestDefinitionEntity {
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

  @Column()
  title: string;

  /** 'online' | 'offline' */
  @Column({ type: 'varchar' })
  @Index()
  mode: string;

  /** 'draft' | 'published' | 'closed' */
  @Column({ type: 'varchar', default: 'draft' })
  status: string;

  @Column({ name: 'total_marks', type: 'integer' })
  totalMarks: number;

  @Column({ name: 'duration_minutes', type: 'integer' })
  durationMinutes: number;

  /** JSON array of allowed question types for this test */
  @Column({ name: 'question_types', type: 'text' })
  questionTypes: string;

  @Column({ name: 'lesson_session_id', nullable: true })
  lessonSessionId: string;

  @ManyToOne(() => LessonSessionEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'lesson_session_id' })
  lessonSession: LessonSessionEntity;

  @Column({ name: 'scheduled_at', type: 'datetime', nullable: true })
  scheduledAt: Date;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
