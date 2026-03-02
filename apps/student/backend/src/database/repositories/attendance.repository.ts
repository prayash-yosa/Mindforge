/**
 * Mindforge Backend — Attendance Repository (Task 2.2)
 *
 * Data access for attendance table.
 * All queries scoped by student_id.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AttendanceEntity } from '../entities/attendance.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class AttendanceRepository extends BaseRepository {
  constructor(
    @InjectRepository(AttendanceEntity)
    private readonly repo: Repository<AttendanceEntity>,
  ) {
    super('AttendanceRepository');
  }

  /** Get attendance for a date range (calendar view) */
  async findByStudentAndDateRange(
    studentId: string,
    startDate: string,
    endDate: string,
  ): Promise<AttendanceEntity[]> {
    return this.withErrorHandling(
      () =>
        this.repo.find({
          where: {
            studentId,
            date: Between(startDate, endDate),
          },
          order: { date: 'ASC' },
        }),
      'findByStudentAndDateRange',
    );
  }

  /** Get attendance summary (counts by status) */
  async getSummaryForStudent(
    studentId: string,
    startDate: string,
    endDate: string,
  ): Promise<{ status: string; count: number }[]> {
    return this.withErrorHandling(async () => {
      const result = await this.repo
        .createQueryBuilder('a')
        .select('a.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('a.student_id = :studentId AND a.date BETWEEN :startDate AND :endDate', {
          studentId,
          startDate,
          endDate,
        })
        .groupBy('a.status')
        .getRawMany();
      return result.map((r: any) => ({ status: r.status, count: parseInt(r.count, 10) }));
    }, 'getSummaryForStudent');
  }

  async create(data: Partial<AttendanceEntity>): Promise<AttendanceEntity> {
    return this.withErrorHandling(async () => {
      const entity = this.repo.create(data);
      return this.repo.save(entity);
    }, 'create');
  }

  async createMany(data: Partial<AttendanceEntity>[]): Promise<AttendanceEntity[]> {
    return this.withErrorHandling(async () => {
      const entities = data.map((d) => this.repo.create(d));
      return this.repo.save(entities);
    }, 'createMany');
  }
}
