import { Injectable, Logger } from '@nestjs/common';
import { ClassRepository } from '../../database/repositories/class.repository';
import { EntityNotFoundException } from '../../common/exceptions/domain.exceptions';
import { ClassEntity } from '../../database/entities/class.entity';
import { ClassSessionEntity } from '../../database/entities/class-session.entity';
import { ClassStudentEntity } from '../../database/entities/class-student.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { AddStudentDto } from './dto/add-student.dto';

@Injectable()
export class ClassService {
  private readonly logger = new Logger(ClassService.name);

  constructor(private readonly classRepo: ClassRepository) {}

  async createClass(teacherId: string, dto: CreateClassDto): Promise<ClassEntity> {
    this.logger.log(`Creating class ${dto.grade}-${dto.section} ${dto.subject} for teacher ${teacherId}`);
    return this.classRepo.createClass({ ...dto, teacherId });
  }

  async getClassById(id: string): Promise<ClassEntity> {
    const cls = await this.classRepo.findClassById(id);
    if (!cls) throw new EntityNotFoundException('Class', id);
    return cls;
  }

  async getClassesByTeacher(teacherId: string): Promise<ClassEntity[]> {
    return this.classRepo.findClassesByTeacher(teacherId);
  }

  async createSession(teacherId: string, dto: CreateSessionDto): Promise<ClassSessionEntity> {
    const cls = await this.getClassById(dto.classId);

    const scheduledAt = new Date(dto.scheduledAt);
    const editableUntil = new Date(scheduledAt);
    editableUntil.setHours(23, 59, 59, 999);

    return this.classRepo.createSession({
      classId: dto.classId,
      teacherId,
      subject: dto.subject,
      scheduledAt,
      durationMinutes: dto.durationMinutes ?? 60,
      editableUntil,
    });
  }

  async getSessionById(id: string): Promise<ClassSessionEntity> {
    const session = await this.classRepo.findSessionById(id);
    if (!session) throw new EntityNotFoundException('ClassSession', id);
    return session;
  }

  async getSessionsByClass(classId: string, from?: string, to?: string): Promise<ClassSessionEntity[]> {
    return this.classRepo.findSessionsByClass(
      classId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  async addStudent(dto: AddStudentDto): Promise<ClassStudentEntity> {
    await this.getClassById(dto.classId);
    return this.classRepo.addStudentToClass(dto);
  }

  async getStudentsByClass(classId: string): Promise<ClassStudentEntity[]> {
    return this.classRepo.findStudentsByClass(classId);
  }

  async removeStudent(classId: string, studentId: string): Promise<void> {
    await this.classRepo.removeStudentFromClass(classId, studentId);
  }
}
