/**
 * Mindforge Backend — Teaching Feed Repository (Task 2.2)
 *
 * Data access for teaching_feed table (NotebookLM daily summaries).
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeachingFeedEntity } from '../entities/teaching-feed.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class TeachingFeedRepository extends BaseRepository {
  constructor(
    @InjectRepository(TeachingFeedEntity)
    private readonly repo: Repository<TeachingFeedEntity>,
  ) {
    super('TeachingFeedRepository');
  }

  /** Get today's feed for a class */
  async findByClassAndDate(
    studentClass: string,
    date: string,
  ): Promise<TeachingFeedEntity[]> {
    return this.withErrorHandling(
      () =>
        this.repo.find({
          where: { class: studentClass, date },
          order: { subject: 'ASC' },
        }),
      'findByClassAndDate',
    );
  }

  /** Get recent feed entries for a class */
  async findRecentByClass(
    studentClass: string,
    limit = 7,
  ): Promise<TeachingFeedEntity[]> {
    return this.withErrorHandling(
      () =>
        this.repo.find({
          where: { class: studentClass },
          order: { date: 'DESC' },
          take: limit,
        }),
      'findRecentByClass',
    );
  }

  async create(data: Partial<TeachingFeedEntity>): Promise<TeachingFeedEntity> {
    return this.withErrorHandling(async () => {
      const entity = this.repo.create(data);
      return this.repo.save(entity);
    }, 'create');
  }
}
