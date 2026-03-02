/**
 * Mindforge Backend — Doubt Repository (Task 2.2)
 *
 * Data access for doubt_threads and doubt_messages tables.
 * All queries scoped by student_id.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoubtThreadEntity } from '../entities/doubt-thread.entity';
import { DoubtMessageEntity } from '../entities/doubt-message.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class DoubtRepository extends BaseRepository {
  constructor(
    @InjectRepository(DoubtThreadEntity)
    private readonly threadRepo: Repository<DoubtThreadEntity>,
    @InjectRepository(DoubtMessageEntity)
    private readonly messageRepo: Repository<DoubtMessageEntity>,
  ) {
    super('DoubtRepository');
  }

  /** Get all threads for a student */
  async findThreadsByStudent(studentId: string): Promise<DoubtThreadEntity[]> {
    return this.withErrorHandling(
      () =>
        this.threadRepo.find({
          where: { studentId },
          order: { updatedAt: 'DESC' },
        }),
      'findThreadsByStudent',
    );
  }

  /** Get a thread with messages (scoped to student) */
  async findThreadByIdForStudent(
    threadId: string,
    studentId: string,
  ): Promise<DoubtThreadEntity | null> {
    return this.withErrorHandling(
      () =>
        this.threadRepo.findOne({
          where: { id: threadId, studentId },
          relations: ['messages'],
          order: { messages: { createdAt: 'ASC' } },
        }),
      'findThreadByIdForStudent',
    );
  }

  /** Create a new doubt thread */
  async createThread(data: Partial<DoubtThreadEntity>): Promise<DoubtThreadEntity> {
    return this.withErrorHandling(async () => {
      const entity = this.threadRepo.create(data);
      return this.threadRepo.save(entity);
    }, 'createThread');
  }

  /** Add a message to a thread */
  async addMessage(data: Partial<DoubtMessageEntity>): Promise<DoubtMessageEntity> {
    return this.withErrorHandling(async () => {
      const entity = this.messageRepo.create(data);
      const saved = await this.messageRepo.save(entity);
      // Update thread's updatedAt
      await this.threadRepo.update(data.threadId!, { updatedAt: new Date() });
      return saved;
    }, 'addMessage');
  }

  /** Mark thread as resolved */
  async resolveThread(threadId: string, studentId: string): Promise<void> {
    return this.withErrorHandling(async () => {
      await this.threadRepo.update({ id: threadId, studentId }, { isResolved: true });
    }, 'resolveThread');
  }
}
