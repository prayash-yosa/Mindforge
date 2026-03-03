import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { TestRepository } from '../../database/repositories/test.repository';
import { ClassRepository } from '../../database/repositories/class.repository';
import { SyllabusRepository } from '../../database/repositories/syllabus.repository';
import { EntityNotFoundException, InvalidOperationException } from '../../common/exceptions/domain.exceptions';
import { TestDefinitionEntity } from '../../database/entities/test-definition.entity';
import { TestQuestionEntity } from '../../database/entities/test-question.entity';
import { CreateTestDto, UpdateTestDto, ONLINE_QUESTION_TYPES, ALL_QUESTION_TYPES } from './dto/create-test.dto';

@Injectable()
export class TestAuthoringService {
  private readonly logger = new Logger(TestAuthoringService.name);

  constructor(
    private readonly testRepo: TestRepository,
    private readonly classRepo: ClassRepository,
    private readonly syllabusRepo: SyllabusRepository,
  ) {}

  async createTest(teacherId: string, dto: CreateTestDto): Promise<TestDefinitionEntity> {
    const cls = await this.classRepo.findClassById(dto.classId);
    if (!cls) throw new EntityNotFoundException('Class', dto.classId);

    this.validateQuestionTypes(dto.mode, dto.questionTypes);

    if (dto.lessonSessionId) {
      const lesson = await this.syllabusRepo.findLessonById(dto.lessonSessionId);
      if (!lesson) throw new EntityNotFoundException('LessonSession', dto.lessonSessionId);
    }

    const definition = await this.testRepo.createDefinition({
      classId: dto.classId,
      subject: dto.subject,
      title: dto.title,
      mode: dto.mode,
      status: 'draft',
      totalMarks: dto.totalMarks,
      durationMinutes: dto.durationMinutes,
      questionTypes: JSON.stringify(dto.questionTypes),
      lessonSessionId: dto.lessonSessionId,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      createdBy: teacherId,
    });

    this.logger.log(`Test created: ${definition.id} (${dto.mode}, ${dto.totalMarks} marks)`);
    return definition;
  }

  async updateTest(testId: string, dto: UpdateTestDto): Promise<TestDefinitionEntity> {
    const test = await this.testRepo.findDefinitionById(testId);
    if (!test) throw new EntityNotFoundException('TestDefinition', testId);

    if (test.status !== 'draft') {
      throw new InvalidOperationException('Only draft tests can be updated');
    }

    if (dto.questionTypes) {
      this.validateQuestionTypes(test.mode, dto.questionTypes);
    }

    const updates: Partial<TestDefinitionEntity> = {};
    if (dto.title) updates.title = dto.title;
    if (dto.totalMarks) updates.totalMarks = dto.totalMarks;
    if (dto.durationMinutes) updates.durationMinutes = dto.durationMinutes;
    if (dto.questionTypes) updates.questionTypes = JSON.stringify(dto.questionTypes);
    if (dto.scheduledAt) updates.scheduledAt = new Date(dto.scheduledAt);

    await this.testRepo.updateDefinition(testId, updates);
    return { ...test, ...updates };
  }

  async publishTest(testId: string, scheduledAt?: string): Promise<void> {
    const test = await this.testRepo.findDefinitionById(testId);
    if (!test) throw new EntityNotFoundException('TestDefinition', testId);

    if (test.status !== 'draft') {
      throw new InvalidOperationException('Only draft tests can be published');
    }

    const questions = await this.testRepo.findQuestionsByTest(testId);
    if (questions.length === 0) {
      throw new InvalidOperationException('Cannot publish a test with no questions');
    }

    const updates: Partial<TestDefinitionEntity> = { status: 'published' };
    if (scheduledAt) updates.scheduledAt = new Date(scheduledAt);

    await this.testRepo.updateDefinition(testId, updates);
    this.logger.log(`Test published: ${testId} with ${questions.length} questions`);
  }

  async closeTest(testId: string): Promise<void> {
    const test = await this.testRepo.findDefinitionById(testId);
    if (!test) throw new EntityNotFoundException('TestDefinition', testId);

    if (test.status !== 'published') {
      throw new InvalidOperationException('Only published tests can be closed');
    }

    await this.testRepo.updateDefinition(testId, { status: 'closed' });
    this.logger.log(`Test closed: ${testId}`);
  }

  async getTestById(testId: string): Promise<TestDefinitionEntity & { questions: TestQuestionEntity[] }> {
    const test = await this.testRepo.findDefinitionById(testId);
    if (!test) throw new EntityNotFoundException('TestDefinition', testId);

    const questions = await this.testRepo.findQuestionsByTest(testId);
    return { ...test, questions };
  }

  async getTestsByClass(classId: string, mode?: string): Promise<TestDefinitionEntity[]> {
    return this.testRepo.findDefinitionsByClass(classId, mode);
  }

  private validateQuestionTypes(mode: string, types: string[]): void {
    const allowed = mode === 'online' ? ONLINE_QUESTION_TYPES : ALL_QUESTION_TYPES;

    for (const t of types) {
      if (!allowed.includes(t)) {
        throw new BadRequestException({
          code: 'INVALID_QUESTION_TYPE',
          message: mode === 'online'
            ? `Online quizzes only allow: ${ONLINE_QUESTION_TYPES.join(', ')}. Got: '${t}'`
            : `Invalid question type: '${t}'`,
        });
      }
    }
  }
}
