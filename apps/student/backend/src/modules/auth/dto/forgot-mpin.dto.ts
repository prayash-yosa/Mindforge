/**
 * Mindforge Backend — Forgot MPIN DTO
 *
 * Validates POST /v1/auth/forgot-mpin request body.
 */

import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ForgotMpinDto {
  @ApiPropertyOptional({ description: 'Student UUID' })
  @IsOptional()
  @IsString()
  @IsUUID(undefined, { message: 'studentId must be a valid UUID' })
  studentId?: string;

  @ApiPropertyOptional({ description: 'Registered contact for OTP' })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  contact?: string;
}
