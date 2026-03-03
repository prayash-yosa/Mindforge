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
import { ClassSessionEntity } from './class-session.entity';

@Entity('attendance_records')
@Unique(['classSessionId', 'studentId'])
@Index(['studentId', 'classSessionId'])
export class AttendanceRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'class_session_id' })
  @Index()
  classSessionId: string;

  @ManyToOne(() => ClassSessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_session_id' })
  classSession: ClassSessionEntity;

  @Column({ name: 'student_id' })
  @Index()
  studentId: string;

  /** 'present' | 'absent' — default in business logic is present; only absents are explicitly recorded */
  @Column({ type: 'varchar', default: 'absent' })
  status: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ name: 'marked_by' })
  markedBy: string;

  @CreateDateColumn({ name: 'marked_at' })
  markedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
