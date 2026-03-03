/**
 * Mindforge Backend — Retrieval Service (Task 8.4)
 *
 * Performs vector similarity search over teacher_material_chunks.
 * Scoped by class/subject. Enforces confidence threshold.
 *
 * Architecture ref: §6.1 — RetrievalService
 * Architecture ref: §7.1 — "Confidence threshold: if best match score below threshold,
 * returns empty (triggers 'Not found in provided material.')"
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbeddingsRepository, ChunkWithScore } from '../../database/repositories/embeddings.repository';

export interface RetrievalContext {
  studentQuestion: string;
  syllabusClass: string;
  syllabusSubject?: string;
  syllabusChapter?: string;
}

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  topScore: number;
  belowThreshold: boolean;
}

export interface RetrievedChunk {
  chunkId: string;
  chunkText: string;
  score: number;
  syllabusSubject: string;
  syllabusChapter: string | null;
  syllabusTopic: string | null;
}

@Injectable()
export class RetrievalService {
  private readonly logger = new Logger(RetrievalService.name);
  private readonly confidenceThreshold: number;
  private readonly topK: number;
  private readonly embeddingBaseUrl: string;
  private readonly embeddingApiKey: string;
  private readonly embeddingModel: string;

  constructor(
    private readonly embeddingsRepo: EmbeddingsRepository,
    private readonly config: ConfigService,
  ) {
    this.confidenceThreshold = parseFloat(this.config.get<string>('RETRIEVAL_CONFIDENCE_THRESHOLD', '0.7'));
    this.topK = parseInt(this.config.get<string>('RETRIEVAL_TOP_K', '5'), 10);
    this.embeddingBaseUrl = this.config.get<string>('ai.baseUrl', 'https://api.openai.com/v1');
    this.embeddingApiKey = this.config.get<string>('ai.apiKey', '');
    this.embeddingModel = this.config.get<string>('EMBEDDING_MODEL', 'text-embedding-3-small');
  }

  /**
   * Search teacher material chunks relevant to the student's question.
   * Returns empty result if no chunks exceed the confidence threshold.
   */
  async search(ctx: RetrievalContext): Promise<RetrievalResult> {
    const queryEmbedding = await this.embedQuery(ctx.studentQuestion);

    if (!queryEmbedding) {
      this.logger.warn('Failed to embed query — returning empty retrieval');
      return { chunks: [], topScore: 0, belowThreshold: true };
    }

    const results = await this.embeddingsRepo.searchSimilar(
      queryEmbedding,
      ctx.syllabusClass,
      ctx.syllabusSubject,
      this.topK,
    );

    const topScore = results.length > 0 ? results[0].score : 0;
    const belowThreshold = topScore < this.confidenceThreshold;

    if (belowThreshold) {
      this.logger.log(`Retrieval below threshold: topScore=${topScore.toFixed(3)}, threshold=${this.confidenceThreshold}`);
      return { chunks: [], topScore, belowThreshold: true };
    }

    const chunks: RetrievedChunk[] = results
      .filter((r) => r.score >= this.confidenceThreshold * 0.8) // include near-threshold chunks
      .map((r) => ({
        chunkId: r.chunk.id,
        chunkText: r.chunk.chunkText,
        score: r.score,
        syllabusSubject: r.chunk.syllabusSubject,
        syllabusChapter: r.chunk.syllabusChapter,
        syllabusTopic: r.chunk.syllabusTopic,
      }));

    this.logger.log(`Retrieval: ${chunks.length} chunks found, topScore=${topScore.toFixed(3)}`);
    return { chunks, topScore, belowThreshold: false };
  }

  /** Embed a single query string using the same embedding model */
  private async embedQuery(text: string): Promise<number[] | null> {
    if (!this.embeddingApiKey) {
      this.logger.warn('Embedding API key not configured');
      return null;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const response = await fetch(`${this.embeddingBaseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.embeddingApiKey}`,
        },
        body: JSON.stringify({ model: this.embeddingModel, input: [text] }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        this.logger.error(`Embedding API error: HTTP ${response.status}`);
        return null;
      }

      const data = (await response.json()) as { data?: Array<{ embedding?: number[] }> };
      return data?.data?.[0]?.embedding ?? null;
    } catch (err: any) {
      this.logger.error(`Embedding query failed: ${err.message}`);
      return null;
    }
  }
}
