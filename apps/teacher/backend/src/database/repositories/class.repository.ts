import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { ClassEntity } from '../entities/class.entity';
import { ClassSessionEntity } from '../entities/class-session.entity';
import { ClassStudentEntity } from '../entities/class-student.entity';

@Injectable()
export class ClassRepository extends BaseRepository {
  constructor(
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
    @InjectRepository(ClassSessionEntity)
    private readonly sessionRepo: Repository<ClassSessionEntity>,
    @InjectRepository(ClassStudentEntity)
    private readonly studentRepo: Repository<ClassStudentEntity>,
  ) {
    super('ClassRepository');
  }

  // ── Class CRUD ──────────────────────────────────────────

  async createClass(data: Partial<ClassEntity>): Promise<ClassEntity> {
    return this.withErrorHandling(
      () => this.classRepo.save(this.classRepo.create(data)),
      'createClass',
    );
  }

  async findClassById(id: string): Promise<ClassEntity | null> {
    return this.withErrorHandling(
      () => this.classRepo.findOne({ where: { id }, relations: ['teacher'] }),
      'findClassById',
    );
  }

  async findClassesByTeacher(teacherId: string): Promise<ClassEntity[]> {
    return this.withErrorHandling(
      () => this.classRepo.find({
        where: { teacherId, isActive: true },
        order: { grade: 'ASC', section: 'ASC', subject: 'ASC' },
      }),
      'findClassesByTeacher',
    );
  }

  /** First active class (for cross-app sync setup). */
  async findFirstClass(): Promise<ClassEntity | null> {
    return this.withErrorHandling(
      () => this.classRepo.findOne({
        where: { isActive: true },
        order: { grade: 'ASC', section: 'ASC', subject: 'ASC' },
      }),
      'findFirstClass',
    );
  }

  /** All active classes (for cross-app sync — merge attendance from all). */
  async findAllActiveClasses(): Promise<ClassEntity[]> {
    return this.withErrorHandling(
      () => this.classRepo.find({
        where: { isActive: true },
        order: { grade: 'ASC', section: 'ASC', subject: 'ASC' },
      }),
      'findAllActiveClasses',
    );
  }

  // ── Session CRUD ────────────────────────────────────────

  async createSession(data: Partial<ClassSessionEntity>): Promise<ClassSessionEntity> {
    return this.withErrorHandling(
      () => this.sessionRepo.save(this.sessionRepo.create(data)),
      'createSession',
    );
  }

  async findSessionById(id: string): Promise<ClassSessionEntity | null> {
    return this.withErrorHandling(
      () => this.sessionRepo.findOne({ where: { id }, relations: ['class'] }),
      'findSessionById',
    );
  }

  async findSessionsByClass(classId: string, from?: Date, to?: Date): Promise<ClassSessionEntity[]> {
    return this.withErrorHandling(async () => {
      const qb = this.sessionRepo.createQueryBuilder('s')
        .where('s.class_id = :classId', { classId });

      if (from) qb.andWhere('s.scheduled_at >= :from', { from });
      if (to) qb.andWhere('s.scheduled_at <= :to', { to });

      return qb.orderBy('s.scheduled_at', 'DESC').getMany();
    }, 'findSessionsByClass');
  }

  async updateSession(id: string, data: Partial<ClassSessionEntity>): Promise<void> {
    return this.withErrorHandling(async () => {
      await this.sessionRepo.update(id, data);
    }, 'updateSession');
  }

  // ── Student Mapping ─────────────────────────────────────

  async addStudentToClass(data: Partial<ClassStudentEntity>): Promise<ClassStudentEntity> {
    return this.withErrorHandling(
      () => this.studentRepo.save(this.studentRepo.create(data)),
      'addStudentToClass',
    );
  }

  async findStudentsByClass(classId: string, activeOnly = true): Promise<ClassStudentEntity[]> {
    return this.withErrorHandling(
      () => this.studentRepo.find({
        where: activeOnly ? { classId, isActive: true } : { classId },
        order: { rollNumber: 'ASC', studentName: 'ASC' },
      }),
      'findStudentsByClass',
    );
  }

  async removeStudentFromClass(classId: string, studentId: string): Promise<void> {
    return this.withErrorHandling(async () => {
      await this.studentRepo.update(
        { classId, studentId },
        { isActive: false },
      );
    }, 'removeStudentFromClass');
  }
}
