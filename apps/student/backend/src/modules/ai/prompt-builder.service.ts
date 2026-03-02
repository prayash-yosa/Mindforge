/**
 * Mindforge Backend — Prompt Builder Service (Task 4.1)
 *
 * Builds structured prompts for AI interactions.
 *
 * Standards applied:
 *   - No PII: uses pseudonymous student ID, syllabus scope only
 *   - Explicit inputs/outputs: typed interfaces for all prompt contexts
 *   - Deterministic: same context → same prompt
 */

import { Injectable } from '@nestjs/common';
import { AiMessage, FallbackConfig } from './ai-provider.service';
import { FeedbackLevel } from '../../database/entities/response.entity';

/** Context for grading prompts — no PII */
export interface GradingPromptContext {
  syllabusSubject: string;
  syllabusChapter: string;
  syllabusTopic: string;
  questionType: string;
  questionContent: string;
  rubric?: string;
  studentAnswer: string;
}

/** Context for feedback/guidance prompts — no PII */
export interface FeedbackPromptContext {
  syllabusSubject: string;
  syllabusChapter: string;
  syllabusTopic: string;
  questionContent: string;
  studentAnswer: string;
  isCorrect: boolean | null;
  requestedLevel: FeedbackLevel;
  previousFeedback?: string;
}

/** Context for doubt resolution prompts — no PII */
export interface DoubtPromptContext {
  syllabusClass: string;
  syllabusSubject: string;
  syllabusChapter: string;
  syllabusTopic: string;
  studentMessage: string;
  conversationHistory: { role: string; content: string }[];
}

@Injectable()
export class PromptBuilderService {
  /** System prompt common preamble */
  private readonly systemPreamble =
    'You are a helpful educational tutor for Indian school students. ' +
    'Keep responses clear, concise, age-appropriate, and encouraging. ' +
    'Use simple language. Never reveal test answers directly unless asked for the Solution level.';

  /**
   * Build messages for AI-assisted grading.
   * Cost tier: grading (cheap).
   */
  buildGradingPrompt(ctx: GradingPromptContext): { messages: AiMessage[]; fallback: FallbackConfig } {
    const system =
      `${this.systemPreamble}\n\n` +
      `You are grading a ${ctx.questionType} question.\n` +
      `Subject: ${ctx.syllabusSubject} > ${ctx.syllabusChapter} > ${ctx.syllabusTopic}\n` +
      (ctx.rubric ? `Rubric: ${ctx.rubric}\n` : '') +
      `\nRespond ONLY with valid JSON:\n` +
      `{"isCorrect": true/false/null, "score": 0-100, "feedback": "brief explanation"}`;

    const user =
      `Question: ${ctx.questionContent}\n` +
      `Student Answer: ${ctx.studentAnswer}`;

    return {
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      fallback: {
        content: JSON.stringify({
          isCorrect: null,
          score: null,
          feedback: 'Grading pending — your answer has been recorded and will be evaluated.',
        }),
        reason: 'grading_fallback',
      },
    };
  }

  /**
   * Build messages for progressive feedback guidance.
   * Cost tier: feedback (higher).
   */
  buildFeedbackPrompt(ctx: FeedbackPromptContext): { messages: AiMessage[]; fallback: FallbackConfig } {
    const levelInstructions = this.getLevelInstructions(ctx.requestedLevel);

    const system =
      `${this.systemPreamble}\n\n` +
      `Subject: ${ctx.syllabusSubject} > ${ctx.syllabusChapter} > ${ctx.syllabusTopic}\n` +
      `Guidance level: ${ctx.requestedLevel.toUpperCase()}\n` +
      `Instructions: ${levelInstructions}\n` +
      `\nProvide guidance at the ${ctx.requestedLevel} level ONLY. Do not exceed this level.`;

    const user =
      `Question: ${ctx.questionContent}\n` +
      `Student's answer: ${ctx.studentAnswer}\n` +
      `Result: ${ctx.isCorrect === true ? 'Correct' : ctx.isCorrect === false ? 'Incorrect' : 'Pending'}\n` +
      (ctx.previousFeedback ? `Previous feedback: ${ctx.previousFeedback}\n` : '');

    return {
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      fallback: {
        content: this.getStaticFallback(ctx.requestedLevel, ctx.syllabusSubject, ctx.syllabusTopic),
        reason: 'feedback_fallback',
      },
    };
  }

  /**
   * Build messages for doubt thread AI response.
   * Cost tier: feedback (higher).
   */
  buildDoubtPrompt(ctx: DoubtPromptContext): { messages: AiMessage[]; fallback: FallbackConfig } {
    const system =
      `${this.systemPreamble}\n\n` +
      `Class: ${ctx.syllabusClass}\n` +
      `Subject: ${ctx.syllabusSubject} > ${ctx.syllabusChapter} > ${ctx.syllabusTopic}\n` +
      `\nHelp the student understand concepts. Be patient and use examples.`;

    const messages: AiMessage[] = [{ role: 'system', content: system }];

    // Add conversation history (last 10 messages for context window control)
    const recentHistory = ctx.conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role === 'student' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    // Add latest student message
    messages.push({ role: 'user', content: ctx.studentMessage });

    return {
      messages,
      fallback: {
        content:
          `Good question about ${ctx.syllabusTopic}! ` +
          `I'm unable to provide an AI response right now. ` +
          `Please refer to your ${ctx.syllabusSubject} textbook, Chapter: ${ctx.syllabusChapter}, ` +
          `or ask your teacher for help.`,
        reason: 'doubt_fallback',
      },
    };
  }

  /** Level-specific instructions for progressive guidance */
  private getLevelInstructions(level: FeedbackLevel): string {
    switch (level) {
      case FeedbackLevel.HINT:
        return 'Give a short, subtle hint pointing in the right direction. Do NOT reveal the answer or method.';
      case FeedbackLevel.APPROACH:
        return 'Describe the general approach or method to solve this problem. Do NOT solve it.';
      case FeedbackLevel.CONCEPT:
        return 'Explain the underlying concept with an example. Help the student understand WHY, not just HOW.';
      case FeedbackLevel.SOLUTION:
        return 'Provide the full step-by-step solution with explanation. This is the final level of help.';
      default:
        return 'Provide a brief helpful comment.';
    }
  }

  /** Static fallback content when AI is unavailable */
  private getStaticFallback(
    level: FeedbackLevel,
    subject: string,
    topic: string,
  ): string {
    switch (level) {
      case FeedbackLevel.HINT:
        return `Think about the key concepts in ${topic}. Review the definitions and try again.`;
      case FeedbackLevel.APPROACH:
        return `For ${topic} problems in ${subject}, start by identifying the given information, then apply the relevant formula or method step by step.`;
      case FeedbackLevel.CONCEPT:
        return `The concept behind this ${topic} question relates to fundamental principles in ${subject}. Review your textbook chapter for detailed explanations and examples.`;
      case FeedbackLevel.SOLUTION:
        return `A detailed solution is not available right now. Please ask your teacher for a worked-out solution to this problem.`;
      default:
        return `Review the topic "${topic}" in your ${subject} textbook for more guidance.`;
    }
  }
}
