import { IsString, IsNotEmpty, IsInt, IsOptional, IsBoolean, Min, Max } from 'class-validator';

export class GenerateQuestionsDto {
  @IsString()
  @IsNotEmpty()
  testDefinitionId: string;

  @IsOptional()
  @IsString()
  lessonSessionId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  questionCount?: number;

  @IsOptional()
  @IsBoolean()
  includeNumericals?: boolean;
}
