import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TestDefinitionEntity } from './test-definition.entity';

@Entity('test_questions')
@Index(['testDefinitionId', 'orderIndex'])
export class TestQuestionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'test_definition_id' })
  @Index()
  testDefinitionId: string;

  @ManyToOne(() => TestDefinitionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'test_definition_id' })
  testDefinition: TestDefinitionEntity;

  /** 'mcq' | 'fill_in_blank' | 'true_false' | 'very_short' | 'short' | 'long' | 'numerical' */
  @Column({ name: 'question_type', type: 'varchar' })
  questionType: string;

  @Column({ name: 'question_text', type: 'text' })
  questionText: string;

  /** JSON array for MCQ options; null for other types */
  @Column({ type: 'text', nullable: true })
  options: string;

  @Column({ name: 'correct_answer', type: 'text' })
  correctAnswer: string;

  @Column({ type: 'text', nullable: true })
  explanation: string;

  @Column({ type: 'integer' })
  marks: number;

  @Column({ name: 'order_index', type: 'integer' })
  orderIndex: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
