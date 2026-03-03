import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class AddStudentDto {
  @IsString()
  @IsNotEmpty()
  classId: string;

  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  studentName: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  rollNumber?: string;
}
