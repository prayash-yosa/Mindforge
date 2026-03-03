import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { TestDefinitionEntity } from './test-definition.entity';

@Entity('test_attempts')
@Unique(['testDefinitionId', 'studentId'])
@Index(['studentId', 'testDefinitionId'])
export class TestAttemptEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'test_definition_id' })
  @Index()
  testDefinitionId: string;

  @ManyToOne(() => TestDefinitionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'test_definition_id' })
  testDefinition: TestDefinitionEntity;

  @Column({ name: 'student_id' })
  @Index()
  studentId: string;

  /** 'in_progress' | 'submitted' | 'auto_submitted' | 'evaluated' */
  @Column({ type: 'varchar', default: 'in_progress' })
  status: string;

  @Column({ name: 'started_at', type: 'datetime' })
  startedAt: Date;

  @Column({ name: 'submitted_at', type: 'datetime', nullable: true })
  submittedAt: Date;

  @Column({ name: 'total_marks', type: 'integer', default: 0 })
  totalMarks: number;

  @Column({ name: 'scored_marks', type: 'real', default: 0 })
  scoredMarks: number;

  @Column({ name: 'attempted_count', type: 'integer', default: 0 })
  attemptedCount: number;

  @Column({ name: 'not_attempted_count', type: 'integer', default: 0 })
  notAttemptedCount: number;

  /** JSON map of questionId -> student answer */
  @Column({ type: 'text', nullable: true })
  answers: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
