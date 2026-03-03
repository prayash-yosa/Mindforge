import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Teacher, AuthenticatedTeacher } from '../../common/decorators/teacher.decorator';
import { AuditService } from '../../shared/audit/audit.service';
import { TestAuthoringService } from './test-authoring.service';
import { QuizGenerationService } from './quiz-generation.service';
import { OfflineTestGenerationService } from './offline-test-generation.service';
import { CreateTestDto, UpdateTestDto, PublishTestDto } from './dto/create-test.dto';
import { GenerateQuestionsDto } from './dto/generate-questions.dto';

@ApiTags('Tests')
@Controller('tests')
export class TestsController {
  constructor(
    private readonly authoringService: TestAuthoringService,
    private readonly quizService: QuizGenerationService,
    private readonly offlineService: OfflineTestGenerationService,
    private readonly auditService: AuditService,
  ) {}

  // ── Authoring (Task 4.1) ────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTest(
    @Teacher() teacher: AuthenticatedTeacher,
    @Body() dto: CreateTestDto,
  ) {
    const result = await this.authoringService.createTest(teacher.teacherId, dto);
    this.auditService.log({
      action: 'test.create',
      actor: teacher.teacherId,
      requestId: result.id,
      details: { mode: dto.mode, subject: dto.subject, totalMarks: dto.totalMarks },
    });
    return { success: true, data: result };
  }

  @Patch(':testId')
  async updateTest(
    @Teacher() teacher: AuthenticatedTeacher,
    @Param('testId') testId: string,
    @Body() dto: UpdateTestDto,
  ) {
    const result = await this.authoringService.updateTest(testId, dto);
    this.auditService.log({
      action: 'test.update',
      actor: teacher.teacherId,
      requestId: testId,
    });
    return { success: true, data: result };
  }

  @Post(':testId/publish')
  @HttpCode(HttpStatus.OK)
  async publishTest(
    @Teacher() teacher: AuthenticatedTeacher,
    @Param('testId') testId: string,
    @Body() dto: PublishTestDto,
  ) {
    await this.authoringService.publishTest(testId, dto.scheduledAt);
    this.auditService.log({
      action: 'test.publish',
      actor: teacher.teacherId,
      requestId: testId,
    });
    return { success: true, message: 'Test published' };
  }

  @Post(':testId/close')
  @HttpCode(HttpStatus.OK)
  async closeTest(
    @Teacher() teacher: AuthenticatedTeacher,
    @Param('testId') testId: string,
  ) {
    await this.authoringService.closeTest(testId);
    this.auditService.log({
      action: 'test.close',
      actor: teacher.teacherId,
      requestId: testId,
    });
    return { success: true, message: 'Test closed' };
  }

  @Get(':testId')
  async getTest(@Param('testId') testId: string) {
    const data = await this.authoringService.getTestById(testId);
    return { success: true, data };
  }

  @Get('class/:classId')
  async getTestsByClass(
    @Param('classId') classId: string,
    @Query('mode') mode?: string,
  ) {
    const data = await this.authoringService.getTestsByClass(classId, mode);
    return { success: true, data };
  }

  // ── Online Quiz Generation (Task 4.2) ───────────────────

  @Post('generate/online')
  @HttpCode(HttpStatus.CREATED)
  async generateOnlineQuiz(
    @Teacher() teacher: AuthenticatedTeacher,
    @Body() dto: GenerateQuestionsDto,
  ) {
    const questions = await this.quizService.generateOnlineQuiz(
      dto.testDefinitionId,
      dto.lessonSessionId,
      dto.questionCount,
    );
    this.auditService.log({
      action: 'test.generateOnlineQuiz',
      actor: teacher.teacherId,
      requestId: dto.testDefinitionId,
      details: { generated: questions.length },
    });
    return { success: true, data: questions };
  }

  // ── Offline Test Generation (Task 4.3) ──────────────────

  @Post('generate/offline')
  @HttpCode(HttpStatus.CREATED)
  async generateOfflineTest(
    @Teacher() teacher: AuthenticatedTeacher,
    @Body() dto: GenerateQuestionsDto,
  ) {
    const questions = await this.offlineService.generateOfflineTest(
      dto.testDefinitionId,
      dto.lessonSessionId,
      dto.questionCount,
    );
    this.auditService.log({
      action: 'test.generateOfflineTest',
      actor: teacher.teacherId,
      requestId: dto.testDefinitionId,
      details: { generated: questions.length },
    });
    return { success: true, data: questions };
  }

  @Get(':testId/pdf')
  async getTestPdf(@Param('testId') testId: string) {
    const pdf = await this.offlineService.generatePdfContent(testId);
    return { success: true, data: pdf };
  }
}
