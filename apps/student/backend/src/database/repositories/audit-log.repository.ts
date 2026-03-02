/**
 * Mindforge Backend — Audit Log Repository (Task 2.2)
 *
 * Data access for audit_log table.
 * Write-heavy — mainly inserts for compliance/security logging.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '../entities/audit-log.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class AuditLogRepository extends BaseRepository {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repo: Repository<AuditLogEntity>,
  ) {
    super('AuditLogRepository');
  }

  /** Persist an audit entry */
  async create(data: Partial<AuditLogEntity>): Promise<AuditLogEntity> {
    return this.withErrorHandling(async () => {
      const entity = this.repo.create(data);
      return this.repo.save(entity);
    }, 'create');
  }

  /** Find audit entries by action type */
  async findByAction(action: string, limit = 50): Promise<AuditLogEntity[]> {
    return this.withErrorHandling(
      () =>
        this.repo.find({
          where: { action },
          order: { createdAt: 'DESC' },
          take: limit,
        }),
      'findByAction',
    );
  }

  /** Find audit entries for a student */
  async findByStudent(studentId: string, limit = 50): Promise<AuditLogEntity[]> {
    return this.withErrorHandling(
      () =>
        this.repo.find({
          where: { studentId },
          order: { createdAt: 'DESC' },
          take: limit,
        }),
      'findByStudent',
    );
  }
}
