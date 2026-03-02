/**
 * Mindforge Backend — AI Orchestrator Service (Task 8.5)
 *
 * Builds retrieval-augmented prompts from teacher material chunks
 * and calls the AI provider with strict grounding rules.
 *
 * Architecture ref: §6.1 — AiOrchestratorService
 * Architecture ref: §7.1 — Closed-Domain AI Rules (non-negotiable)
 * Architecture ref: §7.3 — Prompt Structure
 */

import { Injectable, Logger } from '@nestjs/common';
import { AiProviderService, AiMessage, AiProviderResult } from '../ai/ai-provider.service';
import type { RetrievedChunk } from './retrieval.service';

const NOT_FOUND_RESPONSE = 'Not found in provided material.';

export interface OrchestratorInput {
  studentQuestion: string;
  retrievedChunks: RetrievedChunk[];
  syllabusClass: string;
  syllabusSubject: string;
  conversationHistory?: { role: string; content: string }[];
}

export interface OrchestratorResult {
  content: string;
  model: string;
  tokensUsed: { prompt: number; completion: number; total: number };
  latencyMs: number;
  fromFallback: boolean;
  chunkIdsProvided: string[];
}

@Injectable()
export class AiOrchestratorService {
  private readonly logger = new Logger(AiOrchestratorService.name);

  constructor(private readonly aiProvider: AiProviderService) {}

  /**
   * Build a retrieval-augmented prompt and call the AI provider.
   * Temperature forced to 0.15 for deterministic, grounded responses.
   * On any failure, returns NOT_FOUND_RESPONSE (fail closed).
   */
  async generate(input: OrchestratorInput): Promise<OrchestratorResult> {
    if (input.retrievedChunks.length === 0) {
      return this.buildNotFoundResult();
    }

    const chunkIdsProvided = input.retrievedChunks.map((c) => c.chunkId);

    const systemPrompt = this.buildSystemPrompt(input.syllabusClass, input.syllabusSubject);
    const contextBlock = this.buildContextBlock(input.retrievedChunks);

    const messages: AiMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (input.conversationHistory?.length) {
      const recent = input.conversationHistory.slice(-6);
      for (const msg of recent) {
        messages.push({
          role: msg.role === 'student' ? 'user' : 'assistant',
          content: msg.content,
        });
      }
    }

    messages.push({
      role: 'user',
      content: `${contextBlock}\n\nSTUDENT QUESTION:\n${input.studentQuestion}`,
    });

    const result = await this.aiProvider.chatCompletion(
      messages,
      'feedback',
      { content: NOT_FOUND_RESPONSE, reason: 'orchestrator_fallback' },
    );

    return {
      content: result.content,
      model: result.model,
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs,
      fromFallback: result.fromFallback,
      chunkIdsProvided,
    };
  }

  private buildSystemPrompt(syllabusClass: string, syllabusSubject: string): string {
    return [
      `You are a study assistant for Class ${syllabusClass}, Subject ${syllabusSubject}.`,
      'You must answer ONLY using the provided study material excerpts below.',
      'Do NOT use your own training data or general knowledge.',
      'If the answer is not found in the provided material, respond exactly:',
      `"${NOT_FOUND_RESPONSE}"`,
      '',
      'For each statement you make, cite the source using [chunk:{chunk_id}] format.',
      'If you cannot cite a source, do not make the statement.',
      '',
      'Keep responses clear, concise, and age-appropriate.',
    ].join('\n');
  }

  private buildContextBlock(chunks: RetrievedChunk[]): string {
    const lines = ['RETRIEVED CONTEXT:'];
    for (const chunk of chunks) {
      lines.push(`[chunk:${chunk.chunkId}] ${chunk.chunkText}`);
      lines.push('');
    }
    return lines.join('\n');
  }

  private buildNotFoundResult(): OrchestratorResult {
    return {
      content: NOT_FOUND_RESPONSE,
      model: 'none',
      tokensUsed: { prompt: 0, completion: 0, total: 0 },
      latencyMs: 0,
      fromFallback: true,
      chunkIdsProvided: [],
    };
  }
}
