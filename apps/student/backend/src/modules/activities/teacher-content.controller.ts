/**
 * Mindforge Backend — Teacher Content Controller (Task 8.1, 8.8)
 *
 * Handles teacher material upload, listing, and retry.
 * File validation, access control, and audit logging.
 *
 * Architecture ref: §5.2 — Teacher upload endpoint.
 * In v1, teacher_id is passed as a header (X-Teacher-Id) since teacher auth
 * is outside this system's scope. In production, this would use a proper
 * teacher authentication mechanism.
 */

import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Headers,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '../../common/decorators/public.decorator';
import { TeacherContentService } from './teacher-content.service';
import { TeacherUploadDto } from './dto/teacher-upload.dto';
import { AuditService } from '../../shared/audit/audit.service';

@Controller('v1/teacher')
export class TeacherContentController {
  private readonly logger = new Logger(TeacherContentController.name);

  constructor(
    private readonly contentService: TeacherContentService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * POST /v1/teacher/materials/upload
   * Upload a PDF, DOCX, or TXT file as teacher study material.
   */
  @Public()
  @Post('materials/upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 20 * 1024 * 1024 },
  }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: TeacherUploadDto,
    @Headers('x-teacher-id') teacherId?: string,
  ) {
    if (!teacherId) {
      throw new BadRequestException({ code: 'MISSING_TEACHER_ID', message: 'X-Teacher-Id header is required.' });
    }
    if (!file) {
      throw new BadRequestException({ code: 'MISSING_FILE', message: 'File is required.' });
    }

    const result = await this.contentService.upload({
      teacherId,
      syllabusClass: dto.syllabusClass,
      syllabusSubject: dto.syllabusSubject,
      file: {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      },
    });

    await this.auditService.log({
      requestId: result.id,
      action: 'TEACHER_MATERIAL_UPLOADED',
      metadata: { teacherId, fileName: file.originalname, class: dto.syllabusClass, subject: dto.syllabusSubject },
    });

    return result;
  }

  /**
   * GET /v1/teacher/materials
   * List all materials for a teacher.
   */
  @Public()
  @Get('materials')
  async listMaterials(@Headers('x-teacher-id') teacherId?: string) {
    if (!teacherId) {
      throw new BadRequestException({ code: 'MISSING_TEACHER_ID', message: 'X-Teacher-Id header is required.' });
    }
    return this.contentService.getMaterials(teacherId);
  }

  /**
   * POST /v1/teacher/materials/:id/retry
   * Retry processing a failed material.
   */
  @Public()
  @Post('materials/:id/retry')
  async retryProcessing(
    @Param('id') id: string,
    @Headers('x-teacher-id') teacherId?: string,
  ) {
    if (!teacherId) {
      throw new BadRequestException({ code: 'MISSING_TEACHER_ID', message: 'X-Teacher-Id header is required.' });
    }

    await this.contentService.retryProcessing(id);

    await this.auditService.log({
      requestId: id,
      action: 'TEACHER_MATERIAL_RETRY',
      metadata: { teacherId },
    });

    return { message: 'Processing restarted.' };
  }
}
