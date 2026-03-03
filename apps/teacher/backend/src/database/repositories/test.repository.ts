import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { TestDefinitionEntity } from '../entities/test-definition.entity';
import { TestQuestionEntity } from '../entities/test-question.entity';
import { TestAttemptEntity } from '../entities/test-attempt.entity';
import { OfflineMarkEntryEntity } from '../entities/offline-mark-entry.entity';

@Injectable()
export class TestRepository extends BaseRepository {
  constructor(
    @InjectRepository(TestDefinitionEntity)
    private readonly defRepo: Repository<TestDefinitionEntity>,
    @InjectRepository(TestQuestionEntity)
    private readonly qRepo: Repository<TestQuestionEntity>,
    @InjectRepository(TestAttemptEntity)
    private readonly attemptRepo: Repository<TestAttemptEntity>,
    @InjectRepository(OfflineMarkEntryEntity)
    private readonly markRepo: Repository<OfflineMarkEntryEntity>,
  ) {
    super('TestRepository');
  }

  // ── Test Definition ─────────────────────────────────────

  async createDefinition(data: Partial<TestDefinitionEntity>): Promise<TestDefinitionEntity> {
    return this.withErrorHandling(
      () => this.defRepo.save(this.defRepo.create(data)),
      'createDefinition',
    );
  }

  async findDefinitionById(id: string): Promise<TestDefinitionEntity | null> {
    return this.withErrorHandling(
      () => this.defRepo.findOne({ where: { id }, relations: ['lessonSession'] }),
      'findDefinitionById',
    );
  }

  async findDefinitionsByClass(classId: string, mode?: string): Promise<TestDefinitionEntity[]> {
    return this.withErrorHandling(async () => {
      const where: any = { classId };
      if (mode) where.mode = mode;
      return this.defRepo.find({ where, order: { createdAt: 'DESC' } });
    }, 'findDefinitionsByClass');
  }

  async updateDefinition(id: string, data: Partial<TestDefinitionEntity>): Promise<void> {
    return this.withErrorHandling(async () => {
      await this.defRepo.update(id, data);
    }, 'updateDefinition');
  }

  // ── Questions ───────────────────────────────────────────

  async createQuestions(questions: Partial<TestQuestionEntity>[]): Promise<TestQuestionEntity[]> {
    return this.withErrorHandling(
      () => this.qRepo.save(questions.map((q) => this.qRepo.create(q))),
      'createQuestions',
    );
  }

  async findQuestionsByTest(testDefinitionId: string): Promise<TestQuestionEntity[]> {
    return this.withErrorHandling(
      () => this.qRepo.find({
        where: { testDefinitionId },
        order: { orderIndex: 'ASC' },
      }),
      'findQuestionsByTest',
    );
  }

  // ── Attempts ────────────────────────────────────────────

  async createAttempt(data: Partial<TestAttemptEntity>): Promise<TestAttemptEntity> {
    return this.withErrorHandling(
      () => this.attemptRepo.save(this.attemptRepo.create(data)),
      'createAttempt',
    );
  }

  async findAttemptsByTest(testDefinitionId: string): Promise<TestAttemptEntity[]> {
    return this.withErrorHandling(
      () => this.attemptRepo.find({
        where: { testDefinitionId },
        order: { startedAt: 'DESC' },
      }),
      'findAttemptsByTest',
    );
  }

  async findAttemptByStudentAndTest(
    studentId: string,
    testDefinitionId: string,
  ): Promise<TestAttemptEntity | null> {
    return this.withErrorHandling(
      () => this.attemptRepo.findOne({ where: { studentId, testDefinitionId } }),
      'findAttemptByStudentAndTest',
    );
  }

  async updateAttempt(id: string, data: Partial<TestAttemptEntity>): Promise<void> {
    return this.withErrorHandling(async () => {
      await this.attemptRepo.update(id, data);
    }, 'updateAttempt');
  }

  // ── Offline Marks ───────────────────────────────────────

  async createMarkEntries(entries: Partial<OfflineMarkEntryEntity>[]): Promise<OfflineMarkEntryEntity[]> {
    return this.withErrorHandling(
      () => this.markRepo.save(entries.map((e) => this.markRepo.create(e))),
      'createMarkEntries',
    );
  }

  async findMarksByTest(testDefinitionId: string): Promise<OfflineMarkEntryEntity[]> {
    return this.withErrorHandling(
      () => this.markRepo.find({
        where: { testDefinitionId },
        order: { studentId: 'ASC', questionIndex: 'ASC' },
      }),
      'findMarksByTest',
    );
  }

  async findMarksByStudentAndTest(
    studentId: string,
    testDefinitionId: string,
  ): Promise<OfflineMarkEntryEntity[]> {
    return this.withErrorHandling(
      () => this.markRepo.find({ where: { studentId, testDefinitionId } }),
      'findMarksByStudentAndTest',
    );
  }
}
