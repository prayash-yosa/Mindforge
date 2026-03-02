/**
 * DTOs for Doubts endpoints (Task 5.2)
 */

import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDoubtDto {
  @ApiProperty({ description: 'Student message / question', example: 'Why does pressure increase with depth?' })
  @IsString()
  @IsNotEmpty({ message: 'message must not be empty' })
  @MaxLength(5000)
  message: string;

  @ApiPropertyOptional({ description: 'Existing thread ID to reply to' })
  @IsOptional()
  @IsUUID(undefined, { message: 'threadId must be a valid UUID' })
  threadId?: string;

  @ApiPropertyOptional({ description: 'Syllabus class', example: '8' })
  @IsOptional()
  @IsString()
  syllabusClass?: string;

  @ApiPropertyOptional({ description: 'Syllabus subject', example: 'Science' })
  @IsOptional()
  @IsString()
  syllabusSubject?: string;

  @ApiPropertyOptional({ description: 'Syllabus chapter', example: 'Force and Pressure' })
  @IsOptional()
  @IsString()
  syllabusChapter?: string;

  @ApiPropertyOptional({ description: 'Syllabus topic', example: 'Pressure in Fluids' })
  @IsOptional()
  @IsString()
  syllabusTopic?: string;
}
