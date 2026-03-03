import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { AttendanceRecordEntity } from '../entities/attendance-record.entity';

@Injectable()
export class AttendanceRepository extends BaseRepository {
  constructor(
    @InjectRepository(AttendanceRecordEntity)
    private readonly repo: Repository<AttendanceRecordEntity>,
  ) {
    super('AttendanceRepository');
  }

  async markAttendance(data: Partial<AttendanceRecordEntity>): Promise<AttendanceRecordEntity> {
    return this.withErrorHandling(
      () => this.repo.save(this.repo.create(data)),
      'markAttendance',
    );
  }

  async bulkMark(records: Partial<AttendanceRecordEntity>[]): Promise<AttendanceRecordEntity[]> {
    return this.withErrorHandling(
      () => this.repo.save(records.map((r) => this.repo.create(r))),
      'bulkMark',
    );
  }

  async findBySession(classSessionId: string): Promise<AttendanceRecordEntity[]> {
    return this.withErrorHandling(
      () => this.repo.find({
        where: { classSessionId },
        order: { markedAt: 'ASC' },
      }),
      'findBySession',
    );
  }

  async findByStudentAndDateRange(
    studentId: string,
    from: Date,
    to: Date,
  ): Promise<AttendanceRecordEntity[]> {
    return this.withErrorHandling(
      () => this.repo.createQueryBuilder('a')
        .where('a.student_id = :studentId', { studentId })
        .andWhere('a.marked_at >= :from', { from })
        .andWhere('a.marked_at <= :to', { to })
        .orderBy('a.marked_at', 'ASC')
        .getMany(),
      'findByStudentAndDateRange',
    );
  }

  async updateRecord(id: string, data: Partial<AttendanceRecordEntity>): Promise<void> {
    return this.withErrorHandling(async () => {
      await this.repo.update(id, data);
    }, 'updateRecord');
  }

  async deleteBySession(classSessionId: string): Promise<void> {
    return this.withErrorHandling(async () => {
      await this.repo.delete({ classSessionId });
    }, 'deleteBySession');
  }

  async countAbsentByStudentInWeek(
    studentId: string,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<number> {
    return this.withErrorHandling(
      () => this.repo.createQueryBuilder('a')
        .where('a.student_id = :studentId', { studentId })
        .andWhere('a.status = :status', { status: 'absent' })
        .andWhere('a.marked_at >= :weekStart', { weekStart })
        .andWhere('a.marked_at <= :weekEnd', { weekEnd })
        .getCount(),
      'countAbsentByStudentInWeek',
    );
  }
}
