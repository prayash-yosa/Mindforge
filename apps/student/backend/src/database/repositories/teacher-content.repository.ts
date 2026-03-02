/**
 * Mindforge Backend — Teacher Content Repository (Task 8.1)
 *
 * CRUD for teacher_materials table. Scoped by teacher_id, class, subject, status.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { TeacherMaterialEntity, MaterialStatus } from '../entities/teacher-material.entity';

@Injectable()
export class TeacherContentRepository extends BaseRepository {
  constructor(
    @InjectRepository(TeacherMaterialEntity)
    private readonly repo: Repository<TeacherMaterialEntity>,
  ) {
    super('TeacherContentRepository');
  }

  async create(data: Partial<TeacherMaterialEntity>): Promise<TeacherMaterialEntity> {
    return this.withErrorHandling(
      () => this.repo.save(this.repo.create(data)),
      'create',
    );
  }

  async findById(id: string): Promise<TeacherMaterialEntity | null> {
    return this.withErrorHandling(
      () => this.repo.findOne({ where: { id } }),
      'findById',
    );
  }

  async findByTeacher(teacherId: string): Promise<TeacherMaterialEntity[]> {
    return this.withErrorHandling(
      () => this.repo.find({ where: { teacherId }, order: { uploadedAt: 'DESC' } }),
      'findByTeacher',
    );
  }

  async findByClassAndSubject(syllabusClass: string, syllabusSubject: string): Promise<TeacherMaterialEntity[]> {
    return this.withErrorHandling(
      () => this.repo.find({
        where: { syllabusClass, syllabusSubject, status: MaterialStatus.READY },
        order: { uploadedAt: 'DESC' },
      }),
      'findByClassAndSubject',
    );
  }

  async findReadyByClass(syllabusClass: string): Promise<TeacherMaterialEntity[]> {
    return this.withErrorHandling(
      () => this.repo.find({
        where: { syllabusClass, status: MaterialStatus.READY },
      }),
      'findReadyByClass',
    );
  }

  async updateStatus(id: string, status: MaterialStatus, errorMessage?: string, chunkCount?: number): Promise<void> {
    const update: Partial<TeacherMaterialEntity> = { status };
    if (errorMessage !== undefined) update.errorMessage = errorMessage;
    if (chunkCount !== undefined) update.chunkCount = chunkCount;

    await this.withErrorHandling(
      () => this.repo.update(id, update),
      'updateStatus',
    );
  }
}
