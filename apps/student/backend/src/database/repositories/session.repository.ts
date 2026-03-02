/**
 * Mindforge Backend — Session Repository (Task 2.2)
 *
 * Data access for sessions table.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { SessionEntity } from '../entities/session.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class SessionRepository extends BaseRepository {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly repo: Repository<SessionEntity>,
  ) {
    super('SessionRepository');
  }

  async findById(id: string): Promise<SessionEntity | null> {
    return this.withErrorHandling(
      () => this.repo.findOne({ where: { id } }),
      'findById',
    );
  }

  /** Find active sessions for a student */
  async findActiveByStudent(studentId: string): Promise<SessionEntity[]> {
    return this.withErrorHandling(
      () =>
        this.repo.find({
          where: { studentId, isRevoked: false },
          order: { createdAt: 'DESC' },
        }),
      'findActiveByStudent',
    );
  }

  async create(data: Partial<SessionEntity>): Promise<SessionEntity> {
    return this.withErrorHandling(async () => {
      const entity = this.repo.create(data);
      return this.repo.save(entity);
    }, 'create');
  }

  /** Revoke all sessions for a student (e.g. on lockout or password change) */
  async revokeAllForStudent(studentId: string): Promise<void> {
    return this.withErrorHandling(async () => {
      await this.repo.update({ studentId }, { isRevoked: true });
    }, 'revokeAllForStudent');
  }

  /** Clean up expired sessions */
  async deleteExpired(): Promise<number> {
    return this.withErrorHandling(async () => {
      const result = await this.repo.delete({
        expiresAt: LessThan(new Date()),
      });
      return result.affected ?? 0;
    }, 'deleteExpired');
  }
}
