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
import { TestDefinitionEntity } from './test-definition.entity';

@Entity('offline_mark_entries')
@Index(['testDefinitionId', 'studentId'])
export class OfflineMarkEntryEntity {
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

  @Column({ name: 'section_label', nullable: true })
  sectionLabel: string;

  @Column({ name: 'question_index', type: 'integer', nullable: true })
  questionIndex: number;

  @Column({ name: 'marks_obtained', type: 'real' })
  marksObtained: number;

  @Column({ name: 'max_marks', type: 'real' })
  maxMarks: number;

  @Column({ name: 'entered_by' })
  enteredBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
