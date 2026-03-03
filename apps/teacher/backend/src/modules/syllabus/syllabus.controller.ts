import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes } from '@nestjs/swagger';
import { Teacher, AuthenticatedTeacher } from '../../common/decorators/teacher.decorator';
import { SyllabusUploadService } from './syllabus-upload.service';
import { SyllabusReadService } from './syllabus-read.service';
import { AiIngestionService } from './ai-ingestion.service';
import { AuditService } from '../../shared/audit/audit.service';
import { UploadSyllabusDto } from './dto/upload-syllabus.dto';

@ApiTags('Syllabus')
@Controller('syllabus')
export class SyllabusController {
  constructor(
    private readonly uploadService: SyllabusUploadService,
    private readonly readService: SyllabusReadService,
    private readonly ingestionService: AiIngestionService,
    private readonly auditService: AuditService,
  ) {}

  // ── Task 3.1 — Upload ───────────────────────────────────

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  async uploadSyllabus(
    @Teacher() teacher: AuthenticatedTeacher,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadSyllabusDto,
  ) {
    const doc = await this.uploadService.upload(teacher.teacherId, dto, file);
    this.auditService.log({
      action: 'syllabus.upload',
      actor: teacher.teacherId,
      requestId: doc.id,
      details: { classId: dto.classId, subject: dto.subject, fileName: file.originalname },
    });
    return { success: true, data: doc };
  }

  @Post(':docId/retry')
  @HttpCode(HttpStatus.OK)
  async retryProcessing(
    @Teacher() teacher: AuthenticatedTeacher,
    @Param('docId') docId: string,
  ) {
    const doc = await this.uploadService.retryProcessing(docId);
    this.auditService.log({
      action: 'syllabus.retryProcessing',
      actor: teacher.teacherId,
      requestId: docId,
    });
    return { success: true, data: doc };
  }

  // ── Task 3.2 — AI Ingestion Trigger ─────────────────────

  @Post('process')
  @HttpCode(HttpStatus.OK)
  async triggerProcessing(@Teacher() teacher: AuthenticatedTeacher) {
    const result = await this.ingestionService.processPendingDocuments();
    this.auditService.log({
      action: 'syllabus.triggerProcessing',
      actor: teacher.teacherId,
      requestId: 'batch',
      details: result,
    });
    return { success: true, data: result };
  }

  @Post(':docId/process')
  @HttpCode(HttpStatus.OK)
  async processDocument(
    @Teacher() teacher: AuthenticatedTeacher,
    @Param('docId') docId: string,
  ) {
    await this.ingestionService.processSingleDocument(docId);
    this.auditService.log({
      action: 'syllabus.processDocument',
      actor: teacher.teacherId,
      requestId: docId,
    });
    return { success: true, message: `Document ${docId} processing initiated` };
  }

  // ── Task 3.3 — Read APIs ────────────────────────────────

  @Get('class/:classId')
  async listByClass(@Param('classId') classId: string) {
    const data = await this.readService.listByClass(classId);
    return { success: true, data };
  }

  @Get(':docId')
  async getDocument(@Param('docId') docId: string) {
    const data = await this.readService.getDocumentById(docId);
    return { success: true, data };
  }

  @Get(':docId/lesson')
  async getLessonByDocument(@Param('docId') docId: string) {
    const data = await this.readService.getLessonByDocument(docId);
    return { success: true, data };
  }

  @Get('lessons/class/:classId')
  async getLessonsByClass(
    @Param('classId') classId: string,
    @Query('subject') subject?: string,
  ) {
    const data = await this.readService.getLessonsByClass(classId, subject);
    return { success: true, data };
  }

  @Get('lessons/:lessonId')
  async getLessonById(@Param('lessonId') lessonId: string) {
    const data = await this.readService.getLessonById(lessonId);
    return { success: true, data };
  }
}
