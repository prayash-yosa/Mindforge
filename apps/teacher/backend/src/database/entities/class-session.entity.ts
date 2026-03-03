import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ClassEntity } from './class.entity';
import { TeacherEntity } from './teacher.entity';

@Entity('class_sessions')
@Index(['classId', 'scheduledAt'])
export class ClassSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'class_id' })
  @Index()
  classId: string;

  @ManyToOne(() => ClassEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class: ClassEntity;

  @Column({ name: 'teacher_id' })
  @Index()
  teacherId: string;

  @ManyToOne(() => TeacherEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id' })
  teacher: TeacherEntity;

  @Column()
  subject: string;

  @Column({ name: 'scheduled_at', type: 'datetime' })
  @Index()
  scheduledAt: Date;

  @Column({ name: 'duration_minutes', type: 'integer', default: 60 })
  durationMinutes: number;

  @Column({ name: 'editable_until', type: 'datetime' })
  editableUntil: Date;

  @Column({ name: 'is_attendance_taken', default: false })
  isAttendanceTaken: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
