import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  grade: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  section: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  subject: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  academicYear: string;
}
