import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitAnswersDto {
  @IsString()
  @IsNotEmpty()
  testDefinitionId: string;

  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerEntry)
  answers: AnswerEntry[];
}

export class AnswerEntry {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  answer: string;
}

export class OfflineMarkEntryDto {
  @IsString()
  @IsNotEmpty()
  testDefinitionId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentMarkEntry)
  entries: StudentMarkEntry[];
}

export class StudentMarkEntry {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  sectionLabel?: string;

  @IsOptional()
  @IsNumber()
  questionIndex?: number;

  @IsNumber()
  @Min(0)
  marksObtained: number;

  @IsNumber()
  @Min(0)
  maxMarks: number;
}
