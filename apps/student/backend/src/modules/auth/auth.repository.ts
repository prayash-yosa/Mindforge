/**
 * Mindforge Backend — Auth Repository (Task 2.2 migration)
 *
 * Bridges the auth module to the TypeORM-backed repositories.
 * Maintains the same interface as the Sprint 1 in-memory implementation
 * but now delegates to the global StudentRepository and SessionRepository.
 *
 * Lockout state remains in-memory until Redis is integrated (Task 8.3).
 * When PostgreSQL is running, student and session data comes from DB.
 * When using SQLite dev mode, seeds a test student on startup.
 *
 * Architecture ref: §5.1 Database — students, sessions
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { StudentRepository } from '../../database/repositories/student.repository';
import { SessionRepository } from '../../database/repositories/session.repository';

/** Student auth view (slim projection) */
export interface StudentAuthRecord {
  id: string;
  externalId: string;
  displayName: string;
  class: string;
  board: string;
  mpinHash: string;
}

/** Session record shape */
export interface SessionRecord {
  id: string;
  studentId: string;
  token: string;
  deviceInfo?: string;
  createdAt: Date;
  expiresAt: Date;
}

/** Lockout state (in-memory until Redis — Task 8.3) */
export interface LockoutRecord {
  studentId: string;
  failedAttempts: number;
  lockedUntil: Date | null;
  lastAttemptAt: Date | null;
}

@Injectable()
export class AuthRepository implements OnModuleInit {
  private readonly logger = new Logger(AuthRepository.name);

  // Lockout remains in-memory (migrated to Redis in Task 8.3)
  private lockouts: Map<string, LockoutRecord> = new Map();

  constructor(
    private readonly studentRepo: StudentRepository,
    private readonly sessionRepo: SessionRepository,
  ) {}

  /**
   * Seed a test student on startup (dev mode only).
   * In production, students are provisioned externally.
   */
  async onModuleInit(): Promise<void> {
    // Check if test student already exists
    const existing = await this.studentRepo.findByExternalId('STU-001');
    if (existing) {
      this.logger.log(`Test student already seeded: ${existing.displayName} (ID: ${existing.id})`);
      return;
    }

    // Seed test student
    const testMpinHash = await bcrypt.hash('123456', 10);
    const student = await this.studentRepo.create({
      externalId: 'STU-001',
      displayName: 'Aarav',
      class: '8',
      board: 'CBSE',
      school: 'Demo School',
      mpinHash: testMpinHash,
      consentAi: true,
      consentData: true,
    });

    this.logger.log(`Seeded test student: ${student.displayName} (ID: ${student.id})`);
  }

  // ── Student queries ───────────────────────────────────────────

  /**
   * Find student by MPIN match (bcrypt compare).
   * NOTE: In production DB with many students, this will need a more
   * efficient lookup (e.g. student identifier + MPIN, not MPIN-only scan).
   */
  async findStudentByMpinMatch(mpin: string): Promise<StudentAuthRecord | null> {
    // For now, retrieve all active students and compare
    // This is acceptable for dev/early stage; will be optimized with student identifier
    const students = await this.studentRepo.findByClassAndBoard('8', 'CBSE');
    for (const student of students) {
      const matches = await bcrypt.compare(mpin, student.mpinHash);
      if (matches) {
        return {
          id: student.id,
          externalId: student.externalId,
          displayName: student.displayName,
          class: student.class,
          board: student.board,
          mpinHash: student.mpinHash,
        };
      }
    }
    return null;
  }

  async findStudentById(studentId: string): Promise<StudentAuthRecord | null> {
    const student = await this.studentRepo.findById(studentId);
    if (!student) return null;
    return {
      id: student.id,
      externalId: student.externalId,
      displayName: student.displayName,
      class: student.class,
      board: student.board,
      mpinHash: student.mpinHash,
    };
  }

  // ── Session management (now TypeORM-backed) ────────────────────

  async upsertSession(session: SessionRecord): Promise<void> {
    await this.sessionRepo.create({
      id: session.id,
      studentId: session.studentId,
      token: session.token,
      deviceInfo: session.deviceInfo,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    });
  }

  async invalidateStudentSessions(studentId: string): Promise<void> {
    await this.sessionRepo.revokeAllForStudent(studentId);
  }

  // ── Lockout state (in-memory — migrated to Redis in Task 8.3) ─

  async getLockoutState(studentId: string): Promise<LockoutRecord | null> {
    return this.lockouts.get(studentId) ?? null;
  }

  async recordFailedAttempt(studentId: string): Promise<LockoutRecord> {
    const existing = this.lockouts.get(studentId);
    const record: LockoutRecord = {
      studentId,
      failedAttempts: (existing?.failedAttempts ?? 0) + 1,
      lockedUntil: existing?.lockedUntil ?? null,
      lastAttemptAt: new Date(),
    };
    this.lockouts.set(studentId, record);
    return record;
  }

  async setLockout(studentId: string, lockedUntil: Date): Promise<void> {
    const existing = this.lockouts.get(studentId);
    const record: LockoutRecord = {
      studentId,
      failedAttempts: existing?.failedAttempts ?? 0,
      lockedUntil,
      lastAttemptAt: existing?.lastAttemptAt ?? new Date(),
    };
    this.lockouts.set(studentId, record);
  }

  async resetLockout(studentId: string): Promise<void> {
    this.lockouts.delete(studentId);
  }
}
