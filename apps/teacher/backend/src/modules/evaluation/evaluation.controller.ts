import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Teacher, AuthenticatedTeacher } from '../../common/decorators/teacher.decorator';
import { AuditService } from '../../shared/audit/audit.service';
import { EvaluationService } from './evaluation.service';
import { SubmitAnswersDto, OfflineMarkEntryDto } from './dto/evaluation.dto';

@ApiTags('Evaluation')
@Controller('evaluation')
export class EvaluationController {
  constructor(
    private readonly evaluationService: EvaluationService,
    private readonly auditService: AuditService,
  ) {}

  // ── Online Auto-Grade ────────────────────────────────────

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  async submitAndGrade(@Body() dto: SubmitAnswersDto) {
    const result = await this.evaluationService.submitAndGrade(dto);
    return { success: true, data: result };
  }

  @Post('auto-submit/:testId')
  @HttpCode(HttpStatus.OK)
  async autoSubmitExpired(
    @Teacher() teacher: AuthenticatedTeacher,
    @Param('testId') testId: string,
  ) {
    const result = await this.evaluationService.autoSubmitExpired(testId);
    this.auditService.log({
      action: 'evaluation.autoSubmit',
      actor: teacher.teacherId,
      requestId: testId,
      details: result,
    });
    return { success: true, data: result };
  }

  @Get('attempts/:testId')
  async getAttemptsByTest(@Param('testId') testId: string) {
    const data = await this.evaluationService.getAttemptsByTest(testId);
    return { success: true, data };
  }

  @Get('attempts/:testId/student/:studentId')
  async getStudentAttempt(
    @Param('testId') testId: string,
    @Param('studentId') studentId: string,
  ) {
    const data = await this.evaluationService.getStudentAttempt(studentId, testId);
    return { success: true, data };
  }

  // ── Offline Mark Entry ────────────────────────────────────

  @Post('offline-marks')
  @HttpCode(HttpStatus.CREATED)
  async enterOfflineMarks(
    @Teacher() teacher: AuthenticatedTeacher,
    @Body() dto: OfflineMarkEntryDto,
  ) {
    const data = await this.evaluationService.enterOfflineMarks(teacher.teacherId, dto);
    this.auditService.log({
      action: 'evaluation.offlineMarks',
      actor: teacher.teacherId,
      requestId: dto.testDefinitionId,
      details: { entries: data.length },
    });
    return { success: true, data };
  }

  @Get('offline-marks/:testId')
  async getOfflineMarksByTest(@Param('testId') testId: string) {
    const data = await this.evaluationService.getOfflineMarksByTest(testId);
    return { success: true, data };
  }

  @Get('offline-marks/:testId/student/:studentId')
  async getStudentOfflineMarks(
    @Param('testId') testId: string,
    @Param('studentId') studentId: string,
  ) {
    const data = await this.evaluationService.getStudentOfflineMarks(studentId, testId);
    return { success: true, data };
  }
}
