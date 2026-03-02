/**
 * DTO for GET /v1/student/attendance query parameters.
 *
 * Supports period shortcuts (this_month, last_month, this_term)
 * or explicit startDate/endDate range.
 */

import { IsOptional, IsString, IsEnum, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum AttendancePeriod {
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  THIS_TERM = 'this_term',
}

export class AttendanceQueryDto {
  @ApiPropertyOptional({
    description: 'Period shortcut',
    enum: AttendancePeriod,
    example: AttendancePeriod.THIS_MONTH,
  })
  @IsOptional()
  @IsEnum(AttendancePeriod, { message: 'period must be one of: this_month, last_month, this_term' })
  period?: AttendancePeriod;

  @ApiPropertyOptional({
    description: 'Start date (YYYY-MM-DD); used when period is not specified',
    example: '2026-02-01',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate must be in YYYY-MM-DD format' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (YYYY-MM-DD); used when period is not specified',
    example: '2026-02-28',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate must be in YYYY-MM-DD format' })
  endDate?: string;
}
