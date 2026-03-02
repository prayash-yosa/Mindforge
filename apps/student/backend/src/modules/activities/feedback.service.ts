/**
 * Mindforge Backend — Feedback Service (Task 4.2)
 *
 * Progressive guidance: Hint → Approach → Concept → Solution.
 * Enforces level order — no skipping to solution unless at that level.
 *
 * Standards applied:
 *   - One service = one responsibility (feedback guidance)
 *   - No PII in AI prompts (syllabus context + question only)
 *   - Deterministic fallback when AI is unavailable
 *   - Explicit edge case handling
 */

import { Injectable, Logger } from '@nestjs/common';
import { ActivityRepository } from '../../database/repositories/activity.repository';
import { QuestionRepository } from '../../database/repositories/question.repository';
import { ResponseRepository } from '../../database/repositories/response.repository';
import { AiProviderService } from '../ai/ai-provider.service';
import { PromptBuilderService } from '../ai/prompt-builder.service';
import {
  ActivityNotFoundException,
  QuestionNotFoundException,
} from '../../common/exceptions/domain.exceptions';
import { FeedbackLevel } from '../../database/entities/response.entity';

/** Feedback result returned to the client */
export interface FeedbackResult {
  questionId: string;
  level: FeedbackLevel;
  content: string;
  fromAi: boolean;
  nextLevel: FeedbackLevel | null;
  maxLevelReached: boolean;
}

/** Ordered feedback levels for progression enforcement */
const LEVEL_ORDER: FeedbackLevel[] = [
  FeedbackLevel.HINT,
  FeedbackLevel.APPROACH,
  FeedbackLevel.CONCEPT,
  FeedbackLevel.SOLUTION,
];

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private readonly activityRepo: ActivityRepository,
    private readonly questionRepo: QuestionRepository,
    private readonly responseRepo: ResponseRepository,
    private readonly aiProvider: AiProviderService,
    private readonly promptBuilder: PromptBuilderService,
  ) {}

  /**
   * Get the next feedback level for a question.
   *
   * Level progression is enforced:
   *   Hint(1) → Approach(2) → Concept(3) → Solution(4)
   *
   * If a specific level is requested, it must be >= current level (no downgrading).
   * If no level is requested, auto-advances to the next level.
   */
  async getFeedback(
    activityId: string,
    questionId: string,
    studentId: string,
    requestedLevel?: FeedbackLevel,
  ): Promise<FeedbackResult> {
    // Validate activity belongs to student
    const activity = await this.activityRepo.findByIdForStudent(activityId, studentId);
    if (!activity) throw new ActivityNotFoundException(activityId);

    // Validate question belongs to activity
    const question = await this.questionRepo.findById(questionId);
    if (!question || question.activityId !== activityId) {
      throw new QuestionNotFoundException(questionId);
    }

    // Get existing response (if any)
    const response = await this.responseRepo.findByStudentAndQuestion(studentId, questionId);
    const currentLevel = response?.feedbackLevel ?? FeedbackLevel.NONE;

    // Determine target level
    const targetLevel = this.resolveTargetLevel(currentLevel, requestedLevel);

    // Build syllabus context (no PII)
    const syllabusContext = {
      syllabusSubject: question.syllabus?.subject ?? activity.syllabus?.subject ?? 'General',
      syllabusChapter: question.syllabus?.chapter ?? activity.syllabus?.chapter ?? 'General',
      syllabusTopic: question.syllabus?.topic ?? activity.syllabus?.topic ?? 'General',
    };

    // Build prompt and call AI
    const { messages, fallback } = this.promptBuilder.buildFeedbackPrompt({
      ...syllabusContext,
      questionContent: question.content,
      studentAnswer: response?.answer ?? '',
      isCorrect: response?.isCorrect ?? null,
      requestedLevel: targetLevel,
      previousFeedback: response?.aiFeedback ?? undefined,
    });

    const aiResult = await this.aiProvider.chatCompletion(messages, 'feedback', fallback);

    // Persist the feedback level and AI response to the response record
    if (response) {
      await this.responseRepo.update(response.id, {
        feedbackLevel: targetLevel,
        aiFeedback: aiResult.content,
        aiConversationRef: aiResult.fromFallback ? undefined : `ai:${aiResult.model}`,
      });
    }

    const levelIndex = LEVEL_ORDER.indexOf(targetLevel);
    const isMaxLevel = levelIndex === LEVEL_ORDER.length - 1;
    const nextLevel = isMaxLevel ? null : LEVEL_ORDER[levelIndex + 1];

    return {
      questionId,
      level: targetLevel,
      content: aiResult.content,
      fromAi: !aiResult.fromFallback,
      nextLevel,
      maxLevelReached: isMaxLevel,
    };
  }

  /**
   * Resolve the target feedback level.
   *
   * Rules:
   *   - If no level requested: advance to next level from current
   *   - If level requested: must be >= current level (no downgrade)
   *   - Cannot go past SOLUTION
   */
  private resolveTargetLevel(
    currentLevel: FeedbackLevel,
    requestedLevel?: FeedbackLevel,
  ): FeedbackLevel {
    const currentIndex = currentLevel === FeedbackLevel.NONE
      ? -1
      : LEVEL_ORDER.indexOf(currentLevel);

    if (requestedLevel) {
      const requestedIndex = LEVEL_ORDER.indexOf(requestedLevel);
      // Enforce: no downgrade, no invalid level
      if (requestedIndex < 0) return LEVEL_ORDER[Math.min(currentIndex + 1, LEVEL_ORDER.length - 1)];
      return LEVEL_ORDER[Math.max(requestedIndex, currentIndex + 1)];
    }

    // Auto-advance to next level
    const nextIndex = Math.min(currentIndex + 1, LEVEL_ORDER.length - 1);
    return LEVEL_ORDER[nextIndex];
  }
}
