/**
 * Mindforge Backend — Grading Service (Task 4.3)
 *
 * Deterministic grading for objective types (MCQ, true/false, fill-blank).
 * AI-assisted grading for open-ended types (short/long answer) with rubric.
 *
 * Standards applied:
 *   - Deterministic behavior for objective types (same input → same output)
 *   - No PII in AI prompts (syllabus context and rubric only)
 *   - Rubric and correct answer stored; score and feedback stored per response
 *   - Explicit edge case handling (missing rubric, AI failure)
 *
 * Architecture ref: §9 — "deterministic or cheaper structured evaluation for MCQs"
 */

import { Injectable, Logger } from '@nestjs/common';
import { AiProviderService } from '../ai/ai-provider.service';
import { PromptBuilderService, GradingPromptContext } from '../ai/prompt-builder.service';
import { QuestionType } from '../../database/entities/question.entity';

export interface GradeInput {
  questionType: QuestionType;
  studentAnswer: string;
  correctAnswer?: string;
  rubric?: string;
  syllabusSubject?: string;
  syllabusChapter?: string;
  syllabusTopic?: string;
  questionContent?: string;
}

export interface GradeResult {
  isCorrect: boolean | null;
  score: number | null;
  feedback: string;
  gradingMethod: 'deterministic' | 'ai' | 'pending';
  aiModel?: string;
}

/** Objective question types that can be graded deterministically */
const DETERMINISTIC_TYPES: QuestionType[] = [
  QuestionType.MCQ,
  QuestionType.TRUE_FALSE,
  QuestionType.FILL_BLANK,
];

@Injectable()
export class GradingService {
  private readonly logger = new Logger(GradingService.name);

  constructor(
    private readonly aiProvider: AiProviderService,
    private readonly promptBuilder: PromptBuilderService,
  ) {}

  /**
   * Grade a student's answer.
   *
   * For objective types: deterministic (exact match, case-insensitive).
   * For open-ended types: AI-assisted with rubric; falls back to "pending" on AI failure.
   */
  async grade(input: GradeInput): Promise<GradeResult> {
    if (this.isDeterministic(input.questionType) && input.correctAnswer) {
      return this.gradeDeterministic(input.studentAnswer, input.correctAnswer);
    }

    return this.gradeWithAi(input);
  }

  /** Deterministic grading: exact string match (case-insensitive, trimmed) */
  private gradeDeterministic(studentAnswer: string, correctAnswer: string): GradeResult {
    const isCorrect =
      studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

    return {
      isCorrect,
      score: isCorrect ? 100 : 0,
      feedback: isCorrect ? 'Correct!' : 'Incorrect.',
      gradingMethod: 'deterministic',
    };
  }

  /** AI-assisted grading for open-ended question types */
  private async gradeWithAi(input: GradeInput): Promise<GradeResult> {
    // If AI provider is not configured, return pending
    if (!this.aiProvider.isConfigured()) {
      return {
        isCorrect: null,
        score: null,
        feedback: 'Your answer has been recorded. AI grading will be available when the AI provider is configured.',
        gradingMethod: 'pending',
      };
    }

    const ctx: GradingPromptContext = {
      syllabusSubject: input.syllabusSubject ?? 'General',
      syllabusChapter: input.syllabusChapter ?? 'General',
      syllabusTopic: input.syllabusTopic ?? 'General',
      questionType: input.questionType,
      questionContent: input.questionContent ?? '',
      rubric: input.rubric,
      studentAnswer: input.studentAnswer,
    };

    const { messages, fallback } = this.promptBuilder.buildGradingPrompt(ctx);
    const aiResult = await this.aiProvider.chatCompletion(messages, 'grading', fallback);

    // Parse the AI response (expected JSON: {isCorrect, score, feedback})
    const parsed = this.parseGradingResponse(aiResult.content);

    return {
      isCorrect: parsed.isCorrect,
      score: parsed.score,
      feedback: parsed.feedback,
      gradingMethod: aiResult.fromFallback ? 'pending' : 'ai',
      aiModel: aiResult.fromFallback ? undefined : aiResult.model,
    };
  }

  /** Parse AI grading response JSON */
  private parseGradingResponse(
    content: string,
  ): { isCorrect: boolean | null; score: number | null; feedback: string } {
    try {
      // Try to extract JSON from the response (may be wrapped in markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { isCorrect: null, score: null, feedback: content };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        isCorrect: typeof parsed.isCorrect === 'boolean' ? parsed.isCorrect : null,
        score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : null,
        feedback: typeof parsed.feedback === 'string' ? parsed.feedback : content,
      };
    } catch {
      // If JSON parsing fails, use the raw content as feedback
      this.logger.warn('Failed to parse AI grading JSON — using raw content as feedback');
      return { isCorrect: null, score: null, feedback: content };
    }
  }

  /** Check if a question type can be graded deterministically */
  private isDeterministic(type: QuestionType): boolean {
    return DETERMINISTIC_TYPES.includes(type);
  }
}
