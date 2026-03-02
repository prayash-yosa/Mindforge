/**
 * Mindforge Backend — Student Repository (Task 2.2)
 *
 * Data access for students table.
 * All queries parameterized (TypeORM handles this).
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentEntity } from '../entities/student.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class StudentRepository extends BaseRepository {
  constructor(
    @InjectRepository(StudentEntity)
    private readonly repo: Repository<StudentEntity>,
  ) {
    super('StudentRepository');
  }

  async findById(id: string): Promise<StudentEntity | null> {
    return this.withErrorHandling(
      () => this.repo.findOne({ where: { id } }),
      'findById',
    );
  }

  async findByExternalId(externalId: string): Promise<StudentEntity | null> {
    return this.withErrorHandling(
      () => this.repo.findOne({ where: { externalId } }),
      'findByExternalId',
    );
  }

  async findByClassAndBoard(studentClass: string, board: string): Promise<StudentEntity[]> {
    return this.withErrorHandling(
      () => this.repo.find({ where: { class: studentClass, board } }),
      'findByClassAndBoard',
    );
  }

  async create(data: Partial<StudentEntity>): Promise<StudentEntity> {
    return this.withErrorHandling(async () => {
      const entity = this.repo.create(data);
      return this.repo.save(entity);
    }, 'create');
  }

  async update(id: string, data: Partial<StudentEntity>): Promise<StudentEntity | null> {
    return this.withErrorHandling(async () => {
      await this.repo.update(id, data);
      return this.repo.findOne({ where: { id } });
    }, 'update');
  }
}
