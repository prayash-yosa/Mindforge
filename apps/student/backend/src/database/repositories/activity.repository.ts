/**
 * Mindforge Backend — Activity Repository (Task 2.2)
 *
 * Data access for activities table.
 * All queries scoped by student_id.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { ActivityEntity, ActivityStatus, ActivityType } from '../entities/activity.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class ActivityRepository extends BaseRepository {
  constructor(
    @InjectRepository(ActivityEntity)
    private readonly repo: Repository<ActivityEntity>,
  ) {
    super('ActivityRepository');
  }

  async findById(id: string): Promise<ActivityEntity | null> {
    return this.withErrorHandling(
      () => this.repo.findOne({ where: { id }, relations: ['syllabus'] }),
      'findById',
    );
  }

  /** Find activity by ID scoped to student (no cross-student access) */
  async findByIdForStudent(
    id: string,
    studentId: string,
  ): Promise<ActivityEntity | null> {
    return this.withErrorHandling(
      () =>
        this.repo.findOne({
          where: { id, studentId },
          relations: ['syllabus'],
        }),
      'findByIdForStudent',
    );
  }

  /** Get today's activities for a student */
  async findTodayForStudent(studentId: string): Promise<ActivityEntity[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.withErrorHandling(
      () =>
        this.repo.find({
          where: [
            // Pending/in-progress activities
            {
              studentId,
              status: In([ActivityStatus.PENDING, ActivityStatus.IN_PROGRESS, ActivityStatus.PAUSED]),
            },
            // Activities completed today
            {
              studentId,
              status: ActivityStatus.COMPLETED,
              completedAt: Between(today, tomorrow),
            },
          ],
          relations: ['syllabus'],
          order: { status: 'ASC', createdAt: 'DESC' },
        }),
      'findTodayForStudent',
    );
  }

  /** Get activities by status for a student */
  async findByStatusForStudent(
    studentId: string,
    status: ActivityStatus,
  ): Promise<ActivityEntity[]> {
    return this.withErrorHandling(
      () =>
        this.repo.find({
          where: { studentId, status },
          relations: ['syllabus'],
          order: { createdAt: 'DESC' },
        }),
      'findByStatusForStudent',
    );
  }

  /** Get activities by type for a student */
  async findByTypeForStudent(
    studentId: string,
    type: ActivityType,
  ): Promise<ActivityEntity[]> {
    return this.withErrorHandling(
      () =>
        this.repo.find({
          where: { studentId, type },
          relations: ['syllabus'],
          order: { createdAt: 'DESC' },
        }),
      'findByTypeForStudent',
    );
  }

  async create(data: Partial<ActivityEntity>): Promise<ActivityEntity> {
    return this.withErrorHandling(async () => {
      const entity = this.repo.create(data);
      return this.repo.save(entity);
    }, 'create');
  }

  async update(
    id: string,
    studentId: string,
    data: Partial<ActivityEntity>,
  ): Promise<ActivityEntity | null> {
    return this.withErrorHandling(async () => {
      await this.repo.update({ id, studentId }, data);
      return this.repo.findOne({ where: { id, studentId } });
    }, 'update');
  }

  /** Count completed activities for a student (for progress) */
  async countCompletedForStudent(studentId: string): Promise<number> {
    return this.withErrorHandling(
      () =>
        this.repo.count({
          where: { studentId, status: ActivityStatus.COMPLETED },
        }),
      'countCompletedForStudent',
    );
  }

  /** Get activity breakdown by type with average scores */
  async getProgressOverviewForStudent(
    studentId: string,
  ): Promise<{ type: string; total: number; completed: number; averageScore: number | null }[]> {
    return this.withErrorHandling(async () => {
      const result = await this.repo
        .createQueryBuilder('a')
        .select('a.type', 'type')
        .addSelect('COUNT(*)', 'total')
        .addSelect(
          `SUM(CASE WHEN a.status = '${ActivityStatus.COMPLETED}' THEN 1 ELSE 0 END)`,
          'completed',
        )
        .addSelect(
          `AVG(CASE WHEN a.status = '${ActivityStatus.COMPLETED}' THEN a.score ELSE NULL END)`,
          'averageScore',
        )
        .where('a.student_id = :studentId', { studentId })
        .groupBy('a.type')
        .getRawMany();

      return result.map((r: any) => ({
        type: r.type,
        total: parseInt(r.total, 10),
        completed: parseInt(r.completed, 10),
        averageScore: r.averageScore !== null ? Math.round(parseFloat(r.averageScore)) : null,
      }));
    }, 'getProgressOverviewForStudent');
  }
}
