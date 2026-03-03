import { Injectable, Logger } from '@nestjs/common';
import { SyllabusRepository } from '../../database/repositories/syllabus.repository';
import { EntityNotFoundException } from '../../common/exceptions/domain.exceptions';
import { SyllabusDocumentEntity } from '../../database/entities/syllabus-document.entity';
import { LessonSessionEntity } from '../../database/entities/lesson-session.entity';

export interface SyllabusListItem {
  id: string;
  classId: string;
  subject: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  status: string;
  errorMessage?: string;
  classDate?: string;
  durationMinutes: number;
  uploadedAt: Date;
}

export interface LessonDetail {
  id: string;
  syllabusDocumentId: string;
  classId: string;
  subject: string;
  conceptSummary: string;
  learningObjectives: string[];
  hasNumericals: boolean;
  chapters: string[];
  topics: string[];
  createdAt: Date;
}

@Injectable()
export class SyllabusReadService {
  private readonly logger = new Logger(SyllabusReadService.name);

  constructor(private readonly syllabusRepo: SyllabusRepository) {}

  async listByClass(classId: string): Promise<SyllabusListItem[]> {
    const docs = await this.syllabusRepo.findDocumentsByClass(classId);
    return docs.map((d) => this.toListItem(d));
  }

  async getDocumentById(docId: string): Promise<SyllabusListItem> {
    const doc = await this.syllabusRepo.findDocumentById(docId);
    if (!doc) throw new EntityNotFoundException('SyllabusDocument', docId);
    return this.toListItem(doc);
  }

  async getLessonsByClass(classId: string, subject?: string): Promise<LessonDetail[]> {
    const lessons = await this.syllabusRepo.findLessonsByClass(classId, subject);
    return lessons.map((l) => this.toLessonDetail(l));
  }

  async getLessonById(lessonId: string): Promise<LessonDetail> {
    const lesson = await this.syllabusRepo.findLessonById(lessonId);
    if (!lesson) throw new EntityNotFoundException('LessonSession', lessonId);
    return this.toLessonDetail(lesson);
  }

  async getLessonByDocument(documentId: string): Promise<LessonDetail | null> {
    const lesson = await this.syllabusRepo.findLessonByDocument(documentId);
    if (!lesson) return null;
    return this.toLessonDetail(lesson);
  }

  private toListItem(doc: SyllabusDocumentEntity): SyllabusListItem {
    return {
      id: doc.id,
      classId: doc.classId,
      subject: doc.subject,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSizeBytes: doc.fileSizeBytes,
      status: doc.status,
      errorMessage: doc.errorMessage ?? undefined,
      classDate: doc.classDate ?? undefined,
      durationMinutes: doc.durationMinutes,
      uploadedAt: doc.uploadedAt,
    };
  }

  private toLessonDetail(lesson: LessonSessionEntity): LessonDetail {
    return {
      id: lesson.id,
      syllabusDocumentId: lesson.syllabusDocumentId,
      classId: lesson.classId,
      subject: lesson.subject,
      conceptSummary: lesson.conceptSummary,
      learningObjectives: this.parseJsonArray(lesson.learningObjectives),
      hasNumericals: lesson.hasNumericals,
      chapters: this.parseJsonArray(lesson.chapters),
      topics: this.parseJsonArray(lesson.topics),
      createdAt: lesson.createdAt,
    };
  }

  private parseJsonArray(raw?: string | null): string[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return raw.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
}
