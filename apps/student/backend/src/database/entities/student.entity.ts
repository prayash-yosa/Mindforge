/**
 * Mindforge Backend — Student Entity (Task 2.1)
 *
 * Architecture ref: §5.1 — "students: identity (id, external_id), class, board,
 * school, display_name; MPIN hash; consent flags."
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('students')
export class StudentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** External provisioning ID (e.g. school ERP ID) */
  @Column({ name: 'external_id', unique: true })
  @Index()
  externalId: string;

  @Column({ name: 'display_name' })
  displayName: string;

  /** Academic class (e.g. "8", "10") */
  @Column()
  @Index()
  class: string;

  /** Education board (e.g. "CBSE", "ICSE") */
  @Column()
  board: string;

  /** School identifier */
  @Column({ nullable: true })
  school: string;

  /** Hashed MPIN (bcrypt) — never exposed in API responses */
  @Column({ name: 'mpin_hash' })
  mpinHash: string;

  /** Parental/guardian consent for AI features */
  @Column({ name: 'consent_ai', default: false })
  consentAi: boolean;

  /** Data processing consent */
  @Column({ name: 'consent_data', default: false })
  consentData: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
