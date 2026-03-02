/**
 * Mindforge Backend — Student Controller (Sprint 3 + 5)
 *
 * HTTP-only layer. No business logic. Delegates to StudentService.
 *
 * Endpoints:
 *   GET /v1/student/me          — authenticated student context
 *   GET /v1/student/today       — today's plan (Task 3.1)
 *   GET /v1/student/profile     — student profile with progress overview (Task 5.3)
 *   GET /v1/student/sync/status — sync status with conflict hint (Task 5.3)
 */

import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { Student } from '../../common/decorators/student.decorator';
import { AuthenticatedStudent } from '../../common/guards/auth.guard';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { StudentService } from './student.service';

@ApiTags('Student')
@ApiBearerAuth()
@Controller('v1/student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  /**
   * GET /v1/student/me — Returns the authenticated student context from JWT.
   */
  @Get('me')
  @ApiOperation({ summary: 'Get authenticated student context' })
  @ApiResponse({ status: 200, description: 'Authenticated student info' })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
  getMe(@Student() student: AuthenticatedStudent) {
    return {
      studentId: student.id,
      class: student.class,
      board: student.board,
    };
  }

  /**
   * GET /v1/student/today — Today's plan.
   *
   * Returns today's tasks (homework, quiz, gap-bridge), progress summary.
   * Auth required; scoped by student_id.
   * Empty state supported: returns empty tasks array with zero progress.
   */
  @Get('today')
  @ApiOperation({ summary: "Get today's plan (tasks + progress)" })
  @ApiResponse({ status: 200, description: "Today's plan with task cards and progress" })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Student not found', type: ErrorResponseDto })
  async getToday(@Student() student: AuthenticatedStudent) {
    return this.studentService.getTodayPlan(student.id);
  }

  /**
   * GET /v1/student/profile — Student profile.
   */
  @Get('profile')
  @ApiOperation({ summary: 'Get student profile' })
  @ApiResponse({ status: 200, description: 'Student profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Student not found', type: ErrorResponseDto })
  async getProfile(@Student() student: AuthenticatedStudent) {
    return this.studentService.getProfile(student.id);
  }

  /**
   * GET /v1/student/sync/status — Sync status.
   *
   * Returns last sync timestamp and optional conflict hint
   * (e.g. "newer progress on another device").
   */
  @Get('sync/status')
  @ApiOperation({ summary: 'Get sync status and conflict hint' })
  @ApiResponse({ status: 200, description: 'Sync status' })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
  async getSyncStatus(@Student() student: AuthenticatedStudent) {
    return this.studentService.getSyncStatus(student.id);
  }
}
