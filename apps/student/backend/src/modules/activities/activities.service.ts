/**
 * Mindforge Backend — Activities Service (Sprint 3)
 *
 * Business logic for activity lifecycle: get, respond, pause, results.
 * Services = business logic only. No HTTP, no direct DB access.
 *
 * Standards applied:
 *   - No dead code, no TODOs
 *   - Explicit edge case handling (empty, not found, already completed, idempotent)
 *   - Deterministic behavior (same input → same output)
 *   - No raw exceptions (domain exceptions only)
 */

import { Injectable, Logger } from '@nestjs/common';
import { ActivityRepository } from '../../database/repositories/activity.repository';
import { QuestionRepository } from '../../database/repositories/question.repository';
import { ResponseRepository } from '../../database/repositories/response.repository';
import { GradingService } from './grading.service';
import {
  ActivityNotFoundException,
  ActivityAlreadyCompletedException,
  QuestionNotFoundException,
} from '../../common/exceptions/domain.exceptions';
import { ActivityStatus } from '../../database/entities/activity.entity';
import { FeedbackLevel } from '../../database/entities/response.entity';

/** Activity detail for the Activity screen */
export interface ActivityDetail {
  id: string;
  type: string;
  title: string;
  status: string;
  questionCount: number;
  estimatedMinutes: number | null;
  syllabusRef?: { subject: string; chapter: string; topic: string };
  questions: QuestionView[];
  answeredCount: number;
}

/** Question view — never exposes correct answer to client */
export interface QuestionView {
  id: string;
  type: string;
  content: string;
  options?: string[];
  difficulty: number;
  sortOrder: number;
  answered: boolean;
}

/** Result returned after submitting an answer */
export interface AnswerResult {
  questionId: string;
  isCorrect: boolean | null;
  score: number | null;
  feedback: string;
  feedbackLevel: string;
  isComplete: boolean;
  nextQuestionId: string | null;
}

/** Full activity result (score, breakdown, next suggestion) */
export interface ActivityResult {
  activityId: string;
  type: string;
  title: string;
  status: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  score: number | null;
  breakdown: { questionId: string; isCorrect: boolean | null; score: number | null }[];
  suggestedNext: SuggestedNextCard[];
}

/** Suggested next activity card for the Results screen */
export interface SuggestedNextCard {
  type: string;
  title: string;
  reason: string;
}

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(
    private readonly activityRepo: ActivityRepository,
    private readonly questionRepo: QuestionRepository,
    private readonly responseRepo: ResponseRepository,
    private readonly gradingService: GradingService,
  ) {}

  /**
   * Get activity with questions for the Activity screen.
   * Scoped to student. Transitions PENDING → IN_PROGRESS on first access.
   */
  async getActivity(
    activityId: string,
    studentId: string,
  ): Promise<ActivityDetail> {
    const activity = await this.activityRepo.findByIdForStudent(activityId, studentId);
    if (!activity) throw new ActivityNotFoundException(activityId);

    const questions = await this.questionRepo.findByActivityId(activityId);
    const responses = await this.responseRepo.findByStudentAndActivity(studentId, activityId);
    const answeredIds = new Set(responses.map((r) => r.questionId));

    // Transition PENDING → IN_PROGRESS on first open
    if (activity.status === ActivityStatus.PENDING) {
      await this.activityRepo.update(activityId, studentId, {
        status: ActivityStatus.IN_PROGRESS,
        startedAt: new Date(),
      });
    }

    return {
      id: activity.id,
      type: activity.type,
      title: activity.title,
      status: activity.status === ActivityStatus.PENDING ? ActivityStatus.IN_PROGRESS : activity.status,
      questionCount: activity.questionCount,
      estimatedMinutes: activity.estimatedMinutes,
      syllabusRef: activity.syllabus
        ? { subject: activity.syllabus.subject, chapter: activity.syllabus.chapter, topic: activity.syllabus.topic }
        : undefined,
      questions: questions.map((q) => ({
        id: q.id,
        type: q.type,
        content: q.content,
        options: q.options ?? undefined,
        difficulty: q.difficulty,
        sortOrder: q.sortOrder,
        answered: answeredIds.has(q.id),
      })),
      answeredCount: answeredIds.size,
    };
  }

  /**
   * Submit an answer for a question.
   * Deterministic grading for MCQ/true-false/fill-blank.
   * Idempotent: duplicate submission for same question returns existing result.
   * Auto-completes activity when all questions are answered.
   */
  async submitAnswer(
    activityId: string,
    questionId: string,
    answer: string,
    studentId: string,
    requestFeedbackLevel?: FeedbackLevel,
  ): Promise<AnswerResult> {
    const activity = await this.activityRepo.findByIdForStudent(activityId, studentId);
    if (!activity) throw new ActivityNotFoundException(activityId);
    if (activity.status === ActivityStatus.COMPLETED) {
      throw new ActivityAlreadyCompletedException(activityId);
    }

    const question = await this.questionRepo.findById(questionId);
    if (!question || question.activityId !== activityId) {
      throw new QuestionNotFoundException(questionId);
    }

    // Idempotency: if already answered, return existing result
    const existing = await this.responseRepo.findByStudentAndQuestion(studentId, questionId);
    if (existing) {
      const allQuestions = await this.questionRepo.findByActivityId(activityId);
      const allResponses = await this.responseRepo.findByStudentAndActivity(studentId, activityId);
      const nextQ = this.findNextUnanswered(allQuestions, allResponses);

      return {
        questionId,
        isCorrect: existing.isCorrect,
        score: existing.score,
        feedback: existing.isCorrect === true ? 'Correct!' : existing.isCorrect === false ? 'Incorrect.' : 'Pending evaluation.',
        feedbackLevel: existing.feedbackLevel,
        isComplete: allResponses.length >= allQuestions.length,
        nextQuestionId: nextQ,
      };
    }

    // Grade via GradingService (deterministic for MCQ/TF, AI for open-ended)
    const gradeResult = await this.gradingService.grade({
      questionType: question.type,
      studentAnswer: answer,
      correctAnswer: question.correctAnswer ?? undefined,
      rubric: question.rubric ?? undefined,
      syllabusSubject: question.syllabus?.subject ?? activity.syllabus?.subject,
      syllabusChapter: question.syllabus?.chapter ?? activity.syllabus?.chapter,
      syllabusTopic: question.syllabus?.topic ?? activity.syllabus?.topic,
      questionContent: question.content,
    });

    const { isCorrect, score, feedback } = gradeResult;

    await this.responseRepo.create({
      studentId,
      activityId,
      questionId,
      answer,
      isCorrect: isCorrect ?? undefined,
      score: score ?? undefined,
      feedbackLevel: requestFeedbackLevel ?? FeedbackLevel.NONE,
      aiFeedback: gradeResult.gradingMethod === 'ai' ? feedback : undefined,
      aiConversationRef: gradeResult.aiModel ? `grade:${gradeResult.aiModel}` : undefined,
    });

    // Check if activity is now complete
    const allQuestions = await this.questionRepo.findByActivityId(activityId);
    const allResponses = await this.responseRepo.findByStudentAndActivity(studentId, activityId);
    const isComplete = allResponses.length >= allQuestions.length;

    if (isComplete) {
      const correctCount = allResponses.filter((r) => r.isCorrect === true).length;
      const overallScore = allQuestions.length > 0
        ? Math.round((correctCount / allQuestions.length) * 100)
        : 0;

      await this.activityRepo.update(activityId, studentId, {
        status: ActivityStatus.COMPLETED,
        completedAt: new Date(),
        score: overallScore,
      });
    }

    const nextQ = this.findNextUnanswered(allQuestions, allResponses);

    return {
      questionId,
      isCorrect,
      score,
      feedback,
      feedbackLevel: requestFeedbackLevel ?? FeedbackLevel.NONE,
      isComplete,
      nextQuestionId: nextQ,
    };
  }

  /**
   * Pause an activity and save progress.
   * No-op if already completed.
   */
  async pauseActivity(activityId: string, studentId: string): Promise<void> {
    const activity = await this.activityRepo.findByIdForStudent(activityId, studentId);
    if (!activity) throw new ActivityNotFoundException(activityId);
    if (activity.status === ActivityStatus.COMPLETED) return;

    await this.activityRepo.update(activityId, studentId, {
      status: ActivityStatus.PAUSED,
    });
  }

  /**
   * Get activity result: score, per-question breakdown, suggested next.
   */
  async getResult(activityId: string, studentId: string): Promise<ActivityResult> {
    const activity = await this.activityRepo.findByIdForStudent(activityId, studentId);
    if (!activity) throw new ActivityNotFoundException(activityId);

    const responses = await this.responseRepo.findByStudentAndActivity(studentId, activityId);
    const correctCount = responses.filter((r) => r.isCorrect === true).length;
    const totalQuestions = activity.questionCount || responses.length;
    const overallScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : null;

    // Generate suggested next based on performance
    const suggestedNext = this.buildSuggestedNext(activity.type, overallScore);

    return {
      activityId: activity.id,
      type: activity.type,
      title: activity.title,
      status: activity.status,
      totalQuestions,
      answeredQuestions: responses.length,
      correctAnswers: correctCount,
      score: overallScore,
      breakdown: responses.map((r) => ({
        questionId: r.questionId,
        isCorrect: r.isCorrect,
        score: r.score,
      })),
      suggestedNext,
    };
  }

  /** Find the next unanswered question ID, or null if all answered */
  private findNextUnanswered(
    questions: { id: string }[],
    responses: { questionId: string }[],
  ): string | null {
    const answeredIds = new Set(responses.map((r) => r.questionId));
    const next = questions.find((q) => !answeredIds.has(q.id));
    return next?.id ?? null;
  }

  /** Build suggested next activities based on performance */
  private buildSuggestedNext(activityType: string, score: number | null): SuggestedNextCard[] {
    if (score === null) return [];

    const suggestions: SuggestedNextCard[] = [];

    if (score < 60) {
      suggestions.push({
        type: 'gap_bridge',
        title: 'Review weak areas',
        reason: 'Score below 60% — revisit the concepts.',
      });
    }

    if (score >= 60 && score < 90) {
      suggestions.push({
        type: 'quiz',
        title: 'Practice quiz',
        reason: 'Good effort — practice more to master the topic.',
      });
    }

    if (score >= 90) {
      suggestions.push({
        type: 'homework',
        title: 'Next topic',
        reason: 'Excellent score! Move on to the next topic.',
      });
    }

    return suggestions;
  }
}
