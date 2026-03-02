/**
 * Mindforge Backend — Response Repository (Task 2.2)
 *
 * Data access for responses table.
 * All queries scoped by student_id.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResponseEntity } from '../entities/response.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class ResponseRepository extends BaseRepository {
  constructor(
    @InjectRepository(ResponseEntity)
    private readonly repo: Repository<ResponseEntity>,
  ) {
    super('ResponseRepository');
  }

  async findById(id: string): Promise<ResponseEntity | null> {
    return this.withErrorHandling(
      () => this.repo.findOne({ where: { id } }),
      'findById',
    );
  }

  /** Get all responses for a student+activity */
  async findByStudentAndActivity(
    studentId: string,
    activityId: string,
  ): Promise<ResponseEntity[]> {
    return this.withErrorHandling(
      () =>
        this.repo.find({
          where: { studentId, activityId },
          order: { submittedAt: 'ASC' },
        }),
      'findByStudentAndActivity',
    );
  }

  /** Get response for a specific question (latest attempt) */
  async findByStudentAndQuestion(
    studentId: string,
    questionId: string,
  ): Promise<ResponseEntity | null> {
    return this.withErrorHandling(
      () =>
        this.repo.findOne({
          where: { studentId, questionId },
          order: { attemptNumber: 'DESC' },
        }),
      'findByStudentAndQuestion',
    );
  }

  /** Count correct answers for an activity */
  async countCorrectForActivity(
    studentId: string,
    activityId: string,
  ): Promise<number> {
    return this.withErrorHandling(
      () =>
        this.repo.count({
          where: { studentId, activityId, isCorrect: true },
        }),
      'countCorrectForActivity',
    );
  }

  async create(data: Partial<ResponseEntity>): Promise<ResponseEntity> {
    return this.withErrorHandling(async () => {
      const entity = this.repo.create(data);
      return this.repo.save(entity);
    }, 'create');
  }

  async update(id: string, data: Partial<ResponseEntity>): Promise<ResponseEntity | null> {
    return this.withErrorHandling(async () => {
      await this.repo.update(id, data);
      return this.repo.findOne({ where: { id } });
    }, 'update');
  }
}
