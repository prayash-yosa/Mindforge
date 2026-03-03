import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsIn, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class AbsentStudentEntry {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class MarkAttendanceDto {
  @IsString()
  @IsNotEmpty()
  classSessionId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AbsentStudentEntry)
  absentStudents: AbsentStudentEntry[];
}

export class UpdateAttendanceRecordDto {
  @IsOptional()
  @IsString()
  @IsIn(['present', 'absent'])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
