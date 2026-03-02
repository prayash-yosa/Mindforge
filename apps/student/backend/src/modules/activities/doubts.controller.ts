/**
 * Mindforge Backend — Doubts Controller (Task 5.2)
 *
 * HTTP-only layer. Delegates to DoubtService.
 *
 * Endpoints:
 *   GET  /v1/student/doubts            — list threads
 *   GET  /v1/student/doubts/:threadId  — get thread with messages
 *   POST /v1/student/doubts            — create message (new thread or reply)
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Student } from '../../common/decorators/student.decorator';
import { AuthenticatedStudent } from '../../common/guards/auth.guard';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { DoubtService } from './doubt.service';
import { CreateDoubtDto } from './dto/doubt.dto';

@ApiTags('Doubts')
@ApiBearerAuth()
@Controller('v1/student/doubts')
export class DoubtsController {
  constructor(private readonly doubtService: DoubtService) {}

  /**
   * GET /v1/student/doubts — List all doubt threads for the student.
   */
  @Get()
  @ApiOperation({ summary: 'List doubt threads' })
  @ApiResponse({ status: 200, description: 'List of doubt threads' })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
  async listThreads(@Student() student: AuthenticatedStudent) {
    return this.doubtService.getThreads(student.id);
  }

  /**
   * GET /v1/student/doubts/:threadId — Get thread with messages.
   */
  @Get(':threadId')
  @ApiOperation({ summary: 'Get doubt thread with messages' })
  @ApiParam({ name: 'threadId', description: 'Thread UUID' })
  @ApiResponse({ status: 200, description: 'Thread detail with messages' })
  @ApiResponse({ status: 404, description: 'Thread not found', type: ErrorResponseDto })
  async getThread(
    @Param('threadId') threadId: string,
    @Student() student: AuthenticatedStudent,
  ) {
    return this.doubtService.getThread(threadId, student.id);
  }

  /**
   * POST /v1/student/doubts — Create a new doubt message.
   *
   * If threadId is provided, adds to existing thread.
   * Otherwise creates a new thread with syllabus context.
   * AI responds with syllabus-aligned answer (or fallback).
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create doubt message (new thread or reply)' })
  @ApiResponse({ status: 201, description: 'Thread with new message + AI response' })
  @ApiResponse({ status: 400, description: 'Validation error', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Student or thread not found', type: ErrorResponseDto })
  async createMessage(
    @Body() dto: CreateDoubtDto,
    @Student() student: AuthenticatedStudent,
  ) {
    return this.doubtService.createMessage(student.id, {
      message: dto.message,
      threadId: dto.threadId,
      syllabusClass: dto.syllabusClass,
      syllabusSubject: dto.syllabusSubject,
      syllabusChapter: dto.syllabusChapter,
      syllabusTopic: dto.syllabusTopic,
    });
  }
}
