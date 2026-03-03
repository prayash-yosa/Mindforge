import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { SyllabusDocumentEntity } from '../entities/syllabus-document.entity';
import { LessonSessionEntity } from '../entities/lesson-session.entity';

@Injectable()
export class SyllabusRepository extends BaseRepository {
  constructor(
    @InjectRepository(SyllabusDocumentEntity)
    private readonly docRepo: Repository<SyllabusDocumentEntity>,
    @InjectRepository(LessonSessionEntity)
    private readonly lessonRepo: Repository<LessonSessionEntity>,
  ) {
    super('SyllabusRepository');
  }

  // ── Document CRUD ───────────────────────────────────────

  async createDocument(data: Partial<SyllabusDocumentEntity>): Promise<SyllabusDocumentEntity> {
    return this.withErrorHandling(
      () => this.docRepo.save(this.docRepo.create(data)),
      'createDocument',
    );
  }

  async findDocumentById(id: string): Promise<SyllabusDocumentEntity | null> {
    return this.withErrorHandling(
      () => this.docRepo.findOne({ where: { id } }),
      'findDocumentById',
    );
  }

  async findDocumentsByClass(classId: string): Promise<SyllabusDocumentEntity[]> {
    return this.withErrorHandling(
      () => this.docRepo.find({
        where: { classId },
        order: { uploadedAt: 'DESC' },
      }),
      'findDocumentsByClass',
    );
  }

  async findPendingDocuments(): Promise<SyllabusDocumentEntity[]> {
    return this.withErrorHandling(
      () => this.docRepo.find({ where: { status: 'pending' } }),
      'findPendingDocuments',
    );
  }

  async updateDocumentStatus(
    id: string,
    status: string,
    errorMessage?: string,
  ): Promise<void> {
    return this.withErrorHandling(async () => {
      const update: Partial<SyllabusDocumentEntity> = { status };
      if (errorMessage) update.errorMessage = errorMessage;
      await this.docRepo.update(id, update);
    }, 'updateDocumentStatus');
  }

  // ── Lesson Session CRUD ─────────────────────────────────

  async createLesson(data: Partial<LessonSessionEntity>): Promise<LessonSessionEntity> {
    return this.withErrorHandling(
      () => this.lessonRepo.save(this.lessonRepo.create(data)),
      'createLesson',
    );
  }

  async findLessonById(id: string): Promise<LessonSessionEntity | null> {
    return this.withErrorHandling(
      () => this.lessonRepo.findOne({ where: { id } }),
      'findLessonById',
    );
  }

  async findLessonsByClass(classId: string, subject?: string): Promise<LessonSessionEntity[]> {
    return this.withErrorHandling(async () => {
      const where: any = { classId };
      if (subject) where.subject = subject;
      return this.lessonRepo.find({ where, order: { createdAt: 'DESC' } });
    }, 'findLessonsByClass');
  }

  async findLessonByDocument(syllabusDocumentId: string): Promise<LessonSessionEntity | null> {
    return this.withErrorHandling(
      () => this.lessonRepo.findOne({ where: { syllabusDocumentId } }),
      'findLessonByDocument',
    );
  }
}
