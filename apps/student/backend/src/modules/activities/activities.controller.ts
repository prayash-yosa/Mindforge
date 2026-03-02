/**
 * Mindforge Backend — Activities Controller (Sprint 3 + 4)
 *
 * HTTP-only layer. No business logic. Delegates to services.
 *
 * Endpoints:
 *   GET  /v1/student/activities/:type/:id          — get activity + questions
 *   POST /v1/student/activities/:type/:id/pause     — save progress
 *   POST /v1/student/activities/:type/:id/respond   — submit answer
 *   GET  /v1/student/activities/:type/:id/feedback  — progressive guidance (Task 4.2)
 *   GET  /v1/student/results/:type/:id              — get result
 */

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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Student } from '../../common/decorators/student.decorator';
import { AuthenticatedStudent } from '../../common/guards/auth.guard';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { ActivitiesService } from './activities.service';
import { FeedbackService } from './feedback.service';
import { RespondDto } from './dto/respond.dto';
import { ActivityType } from '../../database/entities/activity.entity';
import { FeedbackLevel } from '../../database/entities/response.entity';

@ApiTags('Activities')
@ApiBearerAuth()
@Controller('v1/student')
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly feedbackService: FeedbackService,
  ) {}

  /**
   * GET /v1/student/activities/:type/:id
   *
   * Returns activity metadata and questions for the Activity screen.
   * Auth required; scoped by student_id.
   * Types: homework, quiz, test, gap_bridge; 404 if not found or not assigned.
   */
  @Get('activities/:type/:id')
  @ApiOperation({ summary: 'Get activity with questions' })
  @ApiParam({ name: 'type', enum: ActivityType })
  @ApiParam({ name: 'id', description: 'Activity UUID' })
  @ApiResponse({ status: 200, description: 'Activity detail with questions' })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Activity not found', type: ErrorResponseDto })
  async getActivity(
    @Param('type') type: string,
    @Param('id') id: string,
    @Student() student: AuthenticatedStudent,
  ) {
    return this.activitiesService.getActivity(id, student.id);
  }

  /**
   * POST /v1/student/activities/:type/:id/pause
   *
   * Saves progress and marks activity as paused. Client can resume later.
   */
  @Post('activities/:type/:id/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause activity and save progress' })
  @ApiParam({ name: 'type', enum: ActivityType })
  @ApiParam({ name: 'id', description: 'Activity UUID' })
  @ApiResponse({ status: 200, description: 'Activity paused' })
  @ApiResponse({ status: 404, description: 'Activity not found', type: ErrorResponseDto })
  async pauseActivity(
    @Param('id') id: string,
    @Student() student: AuthenticatedStudent,
  ) {
    await this.activitiesService.pauseActivity(id, student.id);
    return { status: 'paused', activityId: id };
  }

  /**
   * POST /v1/student/activities/:type/:id/respond
   *
   * Submits an answer for a question. Deterministic grading for MCQ/TF/fill-blank.
   * Idempotent: duplicate submissions for same question return existing result.
   */
  @Post('activities/:type/:id/respond')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit answer for a question' })
  @ApiParam({ name: 'type', enum: ActivityType })
  @ApiParam({ name: 'id', description: 'Activity UUID' })
  @ApiResponse({ status: 200, description: 'Answer graded' })
  @ApiResponse({ status: 400, description: 'Validation error', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Activity or question not found', type: ErrorResponseDto })
  @ApiResponse({ status: 409, description: 'Activity already completed', type: ErrorResponseDto })
  async respond(
    @Param('id') id: string,
    @Body() dto: RespondDto,
    @Student() student: AuthenticatedStudent,
  ) {
    return this.activitiesService.submitAnswer(
      id,
      dto.questionId,
      dto.answer,
      student.id,
      dto.requestFeedbackLevel,
    );
  }

  /**
   * GET /v1/student/activities/:type/:id/feedback (Task 4.2)
   *
   * Returns the next guidance level for the specified question.
   * Progressive: Hint → Approach → Concept → Solution.
   * Level order enforced — no skipping to solution.
   * AI prompt uses syllabus context only (no PII).
   * Fallback to static hint on AI failure.
   */
  @Get('activities/:type/:id/feedback')
  @ApiOperation({ summary: 'Get progressive AI feedback for a question' })
  @ApiParam({ name: 'type', enum: ActivityType })
  @ApiParam({ name: 'id', description: 'Activity UUID' })
  @ApiQuery({ name: 'questionId', description: 'Question UUID', required: true })
  @ApiQuery({ name: 'level', enum: FeedbackLevel, required: false, description: 'Request specific level (auto-advances if omitted)' })
  @ApiResponse({ status: 200, description: 'Feedback at the requested guidance level' })
  @ApiResponse({ status: 404, description: 'Activity or question not found', type: ErrorResponseDto })
  async getFeedback(
    @Param('id') id: string,
    @Query('questionId') questionId: string,
    @Query('level') level: FeedbackLevel | undefined,
    @Student() student: AuthenticatedStudent,
  ) {
    return this.feedbackService.getFeedback(id, questionId, student.id, level);
  }

  /**
   * GET /v1/student/results/:type/:id
   *
   * Returns score, per-question breakdown, and suggested next activities.
   */
  @Get('results/:type/:id')
  @ApiOperation({ summary: 'Get activity result' })
  @ApiParam({ name: 'type', enum: ActivityType })
  @ApiParam({ name: 'id', description: 'Activity UUID' })
  @ApiResponse({ status: 200, description: 'Activity result with breakdown' })
  @ApiResponse({ status: 404, description: 'Activity not found', type: ErrorResponseDto })
  async getResult(
    @Param('id') id: string,
    @Student() student: AuthenticatedStudent,
  ) {
    return this.activitiesService.getResult(id, student.id);
  }
}
