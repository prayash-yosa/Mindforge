/**
 * Mindforge Backend — Teacher Upload DTO (Task 8.1)
 *
 * Validates metadata fields for teacher material upload.
 * File validation (MIME, size) is handled in the service layer.
 */

import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class TeacherUploadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  syllabusClass: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  syllabusSubject: string;
}
