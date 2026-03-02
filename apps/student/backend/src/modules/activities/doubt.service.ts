/**
 * Mindforge Backend — Doubt Service (Sprint 4 → Sprint 8 Teacher-Grounded)
 *
 * Business logic for doubt threads with syllabus context.
 * Integrates Teacher-Grounded AI pipeline: Retrieval → Orchestrator → Validator.
 * Falls back to "Not found in provided material." when retrieval fails or
 * response validation rejects the AI output (fail closed).
 *
 * Architecture ref: §5.3 — Data Flow (student asks a doubt)
 */

import { Injectable, Logger } from '@nestjs/common';
import { DoubtRepository } from '../../database/repositories/doubt.repository';
import { StudentRepository } from '../../database/repositories/student.repository';
import { RetrievalService } from './retrieval.service';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { ResponseValidatorService } from './response-validator.service';
import { AiUsageLoggerService, AiFeatureType, AiResponseStatus } from './ai-usage-logger.service';
import {
  DoubtThreadNotFoundException,
  StudentNotFoundException,
} from '../../common/exceptions/domain.exceptions';
import { MessageRole } from '../../database/entities/doubt-message.entity';

const NOT_FOUND_RESPONSE = 'Not found in provided material.';

export interface DoubtThreadSummary {
  id: string;
  title: string | null;
  syllabusContext: {
    class?: string;
    subject?: string;
    chapter?: string;
    topic?: string;
  };
  isResolved: boolean;
  messageCount?: number;
  updatedAt: Date;
}

export interface DoubtThreadDetail {
  id: string;
  title: string | null;
  syllabusContext: {
    class?: string;
    subject?: string;
    chapter?: string;
    topic?: string;
  };
  isResolved: boolean;
  messages: { id: string; role: string; content: string; createdAt: Date }[];
}

export interface CreateDoubtInput {
  syllabusClass?: string;
  syllabusSubject?: string;
  syllabusChapter?: string;
  syllabusTopic?: string;
  message: string;
  threadId?: string;
}

@Injectable()
export class DoubtService {
  private readonly logger = new Logger(DoubtService.name);

  constructor(
    private readonly doubtRepo: DoubtRepository,
    private readonly studentRepo: StudentRepository,
    private readonly retrievalService: RetrievalService,
    private readonly orchestrator: AiOrchestratorService,
    private readonly validator: ResponseValidatorService,
    private readonly usageLogger: AiUsageLoggerService,
  ) {}

  async getThreads(studentId: string): Promise<DoubtThreadSummary[]> {
    const threads = await this.doubtRepo.findThreadsByStudent(studentId);
    return threads.map((t) => ({
      id: t.id,
      title: t.title,
      syllabusContext: {
        class: t.syllabusClass ?? undefined,
        subject: t.syllabusSubject ?? undefined,
        chapter: t.syllabusChapter ?? undefined,
        topic: t.syllabusTopic ?? undefined,
      },
      isResolved: t.isResolved,
      updatedAt: t.updatedAt,
    }));
  }

  async getThread(threadId: string, studentId: string): Promise<DoubtThreadDetail> {
    const thread = await this.doubtRepo.findThreadByIdForStudent(threadId, studentId);
    if (!thread) throw new DoubtThreadNotFoundException(threadId);

    return {
      id: thread.id,
      title: thread.title,
      syllabusContext: {
        class: thread.syllabusClass ?? undefined,
        subject: thread.syllabusSubject ?? undefined,
        chapter: thread.syllabusChapter ?? undefined,
        topic: thread.syllabusTopic ?? undefined,
      },
      isResolved: thread.isResolved,
      messages: (thread.messages ?? []).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
    };
  }

  /**
   * Create a doubt message using the Teacher-Grounded AI pipeline:
   * 1. Save student message
   * 2. Retrieve relevant teacher material chunks
   * 3. If below threshold → "Not found in provided material."
   * 4. Build retrieval-augmented prompt and call AI
   * 5. Validate response for citations
   * 6. If invalid → "Not found in provided material."
   * 7. Save validated AI response
   */
  async createMessage(
    studentId: string,
    input: CreateDoubtInput,
  ): Promise<DoubtThreadDetail> {
    const student = await this.studentRepo.findById(studentId);
    if (!student) throw new StudentNotFoundException();

    let threadId = input.threadId;

    if (!threadId) {
      const thread = await this.doubtRepo.createThread({
        studentId,
        syllabusClass: input.syllabusClass,
        syllabusSubject: input.syllabusSubject,
        syllabusChapter: input.syllabusChapter,
        syllabusTopic: input.syllabusTopic,
        title: input.message.substring(0, 100),
      });
      threadId = thread.id;
    }

    await this.doubtRepo.addMessage({
      threadId,
      role: MessageRole.STUDENT,
      content: input.message,
    });

    const thread = await this.doubtRepo.findThreadByIdForStudent(threadId, studentId);
    const syllabusClass = input.syllabusClass ?? thread?.syllabusClass ?? student.class ?? '8';
    const syllabusSubject = input.syllabusSubject ?? thread?.syllabusSubject ?? 'General';
    const syllabusChapter = input.syllabusChapter ?? thread?.syllabusChapter ?? undefined;

    // ── Step 1: Retrieve teacher material ──
    const retrieval = await this.retrievalService.search({
      studentQuestion: input.message,
      syllabusClass,
      syllabusSubject,
      syllabusChapter,
    });

    // ── Step 2: Below threshold → fail closed ──
    if (retrieval.belowThreshold || retrieval.chunks.length === 0) {
      await this.doubtRepo.addMessage({
        threadId,
        role: MessageRole.AI,
        content: NOT_FOUND_RESPONSE,
      });

      await this.usageLogger.log({
        studentId,
        featureType: AiFeatureType.DOUBT,
        modelUsed: 'none',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        latencyMs: 0,
        retrievalChunkCount: 0,
        retrievalTopScore: retrieval.topScore,
        responseStatus: AiResponseStatus.FALLBACK,
        rejectionReason: 'below_retrieval_threshold',
      });

      return this.getThread(threadId, studentId);
    }

    // ── Step 3: Call AI Orchestrator ──
    const history = (thread?.messages ?? []).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const aiResult = await this.orchestrator.generate({
      studentQuestion: input.message,
      retrievedChunks: retrieval.chunks,
      syllabusClass,
      syllabusSubject,
      conversationHistory: history.slice(0, -1),
    });

    // ── Step 4: Validate response ──
    const validation = this.validator.validate({
      aiResponse: aiResult.content,
      availableChunkIds: aiResult.chunkIdsProvided,
    });

    const finalContent = validation.isValid ? validation.validatedResponse : NOT_FOUND_RESPONSE;
    const responseStatus = aiResult.fromFallback
      ? AiResponseStatus.FALLBACK
      : validation.isValid
        ? AiResponseStatus.ACCEPTED
        : AiResponseStatus.REJECTED;

    // ── Step 5: Persist and log ──
    await this.doubtRepo.addMessage({
      threadId,
      role: MessageRole.AI,
      content: finalContent,
      aiModel: aiResult.fromFallback ? 'fallback' : aiResult.model,
    });

    await this.usageLogger.log({
      studentId,
      featureType: AiFeatureType.DOUBT,
      modelUsed: aiResult.model,
      promptTokens: aiResult.tokensUsed.prompt,
      completionTokens: aiResult.tokensUsed.completion,
      totalTokens: aiResult.tokensUsed.total,
      latencyMs: aiResult.latencyMs,
      retrievalChunkCount: retrieval.chunks.length,
      retrievalTopScore: retrieval.topScore,
      responseStatus,
      rejectionReason: validation.rejectionReason ?? undefined,
    });

    return this.getThread(threadId, studentId);
  }
}
