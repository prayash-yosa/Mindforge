/**
 * Mindforge Backend — Syllabus Controller (Task 5.2)
 *
 * HTTP-only layer. Delegates to SyllabusService.
 *
 * Endpoints:
 *   GET /v1/student/syllabus/tree — Class → Subject → Chapter → Topic hierarchy
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
import { SyllabusService } from './syllabus.service';

@ApiTags('Syllabus')
@ApiBearerAuth()
@Controller('v1/student/syllabus')
export class SyllabusController {
  constructor(private readonly syllabusService: SyllabusService) {}

  /**
   * GET /v1/student/syllabus/tree
   *
   * Returns the full syllabus hierarchy for the student's class and board.
   * Used by the Doubts context selector (Screen reference).
   */
  @Get('tree')
  @ApiOperation({ summary: 'Get syllabus tree (Class → Subject → Chapter → Topic)' })
  @ApiResponse({ status: 200, description: 'Syllabus hierarchy' })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
  async getTree(@Student() student: AuthenticatedStudent) {
    return this.syllabusService.getTree(student.class, student.board);
  }
}
