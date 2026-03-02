/**
 * Mindforge Backend — Syllabus Repository (Task 2.2)
 *
 * Data access for syllabus_metadata table.
 * Supports the Class→Subject→Chapter→Topic hierarchy.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyllabusMetadataEntity } from '../entities/syllabus-metadata.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class SyllabusRepository extends BaseRepository {
  constructor(
    @InjectRepository(SyllabusMetadataEntity)
    private readonly repo: Repository<SyllabusMetadataEntity>,
  ) {
    super('SyllabusRepository');
  }

  async findById(id: string): Promise<SyllabusMetadataEntity | null> {
    return this.withErrorHandling(
      () => this.repo.findOne({ where: { id } }),
      'findById',
    );
  }

  /** Get full syllabus tree for a class+board */
  async findByClassAndBoard(
    studentClass: string,
    board: string,
  ): Promise<SyllabusMetadataEntity[]> {
    return this.withErrorHandling(
      () =>
        this.repo.find({
          where: { class: studentClass, board },
          order: { subject: 'ASC', sortOrder: 'ASC' },
        }),
      'findByClassAndBoard',
    );
  }

  /** Get subjects for a class+board */
  async getSubjects(studentClass: string, board: string): Promise<string[]> {
    return this.withErrorHandling(async () => {
      const result = await this.repo
        .createQueryBuilder('s')
        .select('DISTINCT s.subject', 'subject')
        .where('s.class = :class AND s.board = :board', {
          class: studentClass,
          board,
        })
        .orderBy('s.subject', 'ASC')
        .getRawMany();
      return result.map((r: any) => r.subject);
    }, 'getSubjects');
  }

  /** Get chapters for a subject */
  async getChapters(
    studentClass: string,
    board: string,
    subject: string,
  ): Promise<string[]> {
    return this.withErrorHandling(async () => {
      const result = await this.repo
        .createQueryBuilder('s')
        .select('DISTINCT s.chapter', 'chapter')
        .where('s.class = :class AND s.board = :board AND s.subject = :subject', {
          class: studentClass,
          board,
          subject,
        })
        .orderBy('s.sort_order', 'ASC')
        .getRawMany();
      return result.map((r: any) => r.chapter);
    }, 'getChapters');
  }

  /** Get topics for a chapter */
  async getTopics(
    studentClass: string,
    board: string,
    subject: string,
    chapter: string,
  ): Promise<SyllabusMetadataEntity[]> {
    return this.withErrorHandling(
      () =>
        this.repo.find({
          where: { class: studentClass, board, subject, chapter },
          order: { sortOrder: 'ASC' },
        }),
      'getTopics',
    );
  }

  async create(data: Partial<SyllabusMetadataEntity>): Promise<SyllabusMetadataEntity> {
    return this.withErrorHandling(async () => {
      const entity = this.repo.create(data);
      return this.repo.save(entity);
    }, 'create');
  }
}
