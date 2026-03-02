/**
 * Mindforge Backend — Standard Error Response DTO
 *
 * Consistent error shape per Architecture §6:
 *   { code: string, message: string, details?: any }
 *
 * Used across all error responses (400, 401, 403, 404, 429, 500).
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 'VALIDATION_ERROR', description: 'Machine-readable error code' })
  code: string;

  @ApiProperty({ example: 'Request validation failed', description: 'Human-readable message' })
  message: string;

  @ApiPropertyOptional({
    description: 'Optional details (e.g. field-level validation errors)',
    example: [{ field: 'mpin', message: 'MPIN must be exactly 6 digits', type: 'isLength' }],
  })
  details?: any;
}
