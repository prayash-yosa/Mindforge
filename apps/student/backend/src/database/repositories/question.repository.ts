/**
 * Mindforge Backend — Question Repository (Task 2.2)
 *
 * Data access for questions table.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionEntity } from '../entities/question.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class QuestionRepository extends BaseRepository {
  constructor(
    @InjectRepository(QuestionEntity)
    private readonly repo: Repository<QuestionEntity>,
  ) {
    super('QuestionRepository');
  }

  async findById(id: string): Promise<QuestionEntity | null> {
    return this.withErrorHandling(
      () => this.repo.findOne({ where: { id }, relations: ['syllabus'] }),
      'findById',
    );
  }

  /** Get all questions for an activity, ordered by sort_order */
  async findByActivityId(activityId: string): Promise<QuestionEntity[]> {
    return this.withErrorHandling(
      () =>
        this.repo.find({
          where: { activityId },
          order: { sortOrder: 'ASC' },
        }),
      'findByActivityId',
    );
  }

  async create(data: Partial<QuestionEntity>): Promise<QuestionEntity> {
    return this.withErrorHandling(async () => {
      const entity = this.repo.create(data);
      return this.repo.save(entity);
    }, 'create');
  }

  async createMany(data: Partial<QuestionEntity>[]): Promise<QuestionEntity[]> {
    return this.withErrorHandling(async () => {
      const entities = data.map((d) => this.repo.create(d));
      return this.repo.save(entities);
    }, 'createMany');
  }
}
