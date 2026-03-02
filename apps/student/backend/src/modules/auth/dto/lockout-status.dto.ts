/**
 * Mindforge Backend — Lockout Status DTO
 *
 * Validates POST /v1/auth/lockout/status request body.
 * Task 1.3: studentId is required to check lockout.
 */

import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LockoutStatusDto {
  @ApiProperty({
    description: 'Student UUID to check lockout status',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsString()
  @IsUUID(undefined, { message: 'studentId must be a valid UUID' })
  studentId: string;
}
