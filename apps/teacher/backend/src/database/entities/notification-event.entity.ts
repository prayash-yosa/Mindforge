import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('notification_events')
@Index(['recipientRole', 'recipientId', 'isRead'])
export class NotificationEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 'absence_alert' | 'missed_test' | 'auto_submitted' | 'evaluation_pending' | 'general' */
  @Column({ type: 'varchar' })
  @Index()
  category: string;

  /** 'low' | 'medium' | 'high' */
  @Column({ type: 'varchar', default: 'medium' })
  priority: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  body: string;

  /** 'teacher' | 'student' | 'parent' | 'admin' */
  @Column({ name: 'recipient_role', type: 'varchar' })
  @Index()
  recipientRole: string;

  /** Specific user ID (nullable for broadcast-style notifications) */
  @Column({ name: 'recipient_id', nullable: true })
  @Index()
  recipientId: string;

  /** JSON payload for structured data relevant to the notification */
  @Column({ type: 'text', nullable: true })
  payload: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'is_delivered', default: false })
  isDelivered: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
