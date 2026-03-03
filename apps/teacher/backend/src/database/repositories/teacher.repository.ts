import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { TeacherEntity } from '../entities/teacher.entity';

@Injectable()
export class TeacherRepository extends BaseRepository {
  constructor(
    @InjectRepository(TeacherEntity)
    private readonly repo: Repository<TeacherEntity>,
  ) {
    super('TeacherRepository');
  }

  async findById(id: string): Promise<TeacherEntity | null> {
    return this.withErrorHandling(
      () => this.repo.findOne({ where: { id } }),
      'findById',
    );
  }

  async findByExternalId(externalId: string): Promise<TeacherEntity | null> {
    return this.withErrorHandling(
      () => this.repo.findOne({ where: { externalId } }),
      'findByExternalId',
    );
  }

  async findByEmail(email: string): Promise<TeacherEntity | null> {
    return this.withErrorHandling(
      () => this.repo.findOne({ where: { email } }),
      'findByEmail',
    );
  }

  async create(data: Partial<TeacherEntity>): Promise<TeacherEntity> {
    return this.withErrorHandling(
      () => this.repo.save(this.repo.create(data)),
      'create',
    );
  }

  async update(id: string, data: Partial<TeacherEntity>): Promise<TeacherEntity | null> {
    return this.withErrorHandling(async () => {
      await this.repo.update(id, data);
      return this.repo.findOne({ where: { id } });
    }, 'update');
  }

  async findAll(activeOnly = true): Promise<TeacherEntity[]> {
    return this.withErrorHandling(
      () => this.repo.find({
        where: activeOnly ? { isActive: true } : undefined,
        order: { displayName: 'ASC' },
      }),
      'findAll',
    );
  }
}
