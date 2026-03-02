/**
 * Mindforge Backend — Verify MPIN DTO
 *
 * Validates POST /v1/auth/mpin/verify request body.
 * 6-digit numeric MPIN (Architecture §8).
 */

import { IsString, Length, Matches, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyMpinDto {
  @ApiProperty({
    description: '6-digit numeric MPIN',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6, { message: 'MPIN must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'MPIN must contain only digits' })
  mpin: string;

  @ApiPropertyOptional({
    description: 'Optional device info for session tracking',
    example: 'Android/12 Pixel6',
  })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  deviceInfo?: string;
}
