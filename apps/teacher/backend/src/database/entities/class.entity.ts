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
import { TeacherEntity } from './teacher.entity';

@Entity('classes')
@Index(['grade', 'section', 'subject', 'academicYear'], { unique: true })
export class ClassEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  grade: string;

  @Column()
  section: string;

  @Column()
  subject: string;

  @Column({ name: 'academic_year' })
  academicYear: string;

  @Column({ name: 'teacher_id' })
  @Index()
  teacherId: string;

  @ManyToOne(() => TeacherEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id' })
  teacher: TeacherEntity;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
