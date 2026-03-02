/**
 * DTO for activity route parameters: /v1/student/activities/:type/:id
 *
 * Validates the activity type and UUID.
 */

import { IsString, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ActivityType } from '../../../database/entities/activity.entity';

export class ActivityParamsDto {
  @ApiProperty({
    description: 'Activity type',
    enum: ActivityType,
    example: ActivityType.HOMEWORK,
  })
  @IsEnum(ActivityType, { message: 'type must be one of: homework, quiz, test, gap_bridge' })
  type: ActivityType;

  @ApiProperty({ description: 'Activity UUID' })
  @IsString()
  @IsUUID(undefined, { message: 'id must be a valid UUID' })
  id: string;
}
