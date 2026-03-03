import { IsString, IsNotEmpty, IsOptional, IsDateString, IsInt, Min, Max, MaxLength } from 'class-validator';

export class UploadSyllabusDto {
  @IsString()
  @IsNotEmpty()
  classId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  subject: string;

  @IsOptional()
  @IsDateString()
  classDate?: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(180)
  durationMinutes?: number;
}
