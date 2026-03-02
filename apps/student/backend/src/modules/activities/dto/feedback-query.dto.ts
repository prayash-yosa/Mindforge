/**
 * DTO for GET /v1/student/activities/:type/:id/feedback
 *
 * Validates the feedback query parameters.
 */

import { IsUUID, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeedbackLevel } from '../../../database/entities/response.entity';

export class FeedbackQueryDto {
  @ApiProperty({ description: 'Question UUID for which to get feedback' })
  @IsUUID(undefined, { message: 'questionId must be a valid UUID' })
  questionId: string;

  @ApiPropertyOptional({
    description: 'Request a specific level (auto-advances to next if omitted)',
    enum: FeedbackLevel,
  })
  @IsOptional()
  @IsEnum(FeedbackLevel, { message: 'level must be a valid feedback level' })
  level?: FeedbackLevel;
}
