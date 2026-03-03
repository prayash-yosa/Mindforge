import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ClassEntity } from './class.entity';

@Entity('class_students')
@Unique(['classId', 'studentId'])
export class ClassStudentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'class_id' })
  @Index()
  classId: string;

  @ManyToOne(() => ClassEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class: ClassEntity;

  /** References student from the Student service (external ID / UID) */
  @Column({ name: 'student_id' })
  @Index()
  studentId: string;

  @Column({ name: 'student_name' })
  studentName: string;

  @Column({ name: 'roll_number', nullable: true })
  rollNumber: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'enrolled_at' })
  enrolledAt: Date;
}
