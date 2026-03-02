/**
 * DTO for POST /v1/student/activities/:type/:id/respond
 *
 * Validates the answer submission payload.
 */

import { IsString, IsUUID, IsNotEmpty, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeedbackLevel } from '../../../database/entities/response.entity';

export class RespondDto {
  @ApiProperty({ description: 'Question UUID', example: 'abc-123' })
  @IsString()
  @IsUUID(undefined, { message: 'questionId must be a valid UUID' })
  questionId: string;

  @ApiProperty({ description: 'Student answer text', example: 'Option B' })
  @IsString()
  @IsNotEmpty({ message: 'answer must not be empty' })
  @MaxLength(10000)
  answer: string;

  @ApiPropertyOptional({
    description: 'Request AI feedback at this level',
    enum: FeedbackLevel,
    example: FeedbackLevel.HINT,
  })
  @IsOptional()
  @IsEnum(FeedbackLevel, { message: 'requestFeedbackLevel must be a valid feedback level' })
  requestFeedbackLevel?: FeedbackLevel;
}
