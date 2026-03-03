import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsOptional,
  IsArray,
  IsDateString,
  Min,
  Max,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';

export enum TestModeInput {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

const ONLINE_QUESTION_TYPES = ['mcq', 'fill_in_blank', 'true_false'];
const ALL_QUESTION_TYPES = ['mcq', 'fill_in_blank', 'true_false', 'very_short', 'short', 'long', 'numerical'];

export class CreateTestDto {
  @IsString()
  @IsNotEmpty()
  classId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  subject: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsEnum(TestModeInput)
  mode: TestModeInput;

  @IsInt()
  @Min(1)
  @Max(200)
  totalMarks: number;

  @IsInt()
  @Min(5)
  @Max(300)
  durationMinutes: number;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  questionTypes: string[];

  @IsOptional()
  @IsString()
  lessonSessionId?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class UpdateTestDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  totalMarks?: number;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(300)
  durationMinutes?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  questionTypes?: string[];

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class PublishTestDto {
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export { ONLINE_QUESTION_TYPES, ALL_QUESTION_TYPES };
