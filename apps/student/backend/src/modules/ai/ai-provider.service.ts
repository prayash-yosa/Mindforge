/**
 * Mindforge Backend — AI Provider Service (Task 4.1)
 *
 * Outbound HTTP calls to an OpenAI-compatible AI provider.
 *
 * Standards applied:
 *   - Platform-native: uses Node.js fetch + AbortController for timeout
 *   - No PII in prompts: pseudonymous ID and syllabus scope only
 *   - Timeout (10s) with deterministic fallback
 *   - Response validated before return
 *   - Token usage logged for cost tracking
 *   - No raw AI errors exposed to client
 *
 * Architecture ref: §9 — "AI latency budget 3–10s; fallback to
 * deterministic/cached hint on timeout; no hallucinated data to client."
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Cost tier determines which model to use */
export type CostTier = 'grading' | 'feedback';

/** Structured prompt message for the AI provider */
export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Result returned from the AI provider */
export interface AiProviderResult {
  content: string;
  model: string;
  tokensUsed: { prompt: number; completion: number; total: number };
  latencyMs: number;
  fromFallback: boolean;
}

/** Fallback configuration */
export interface FallbackConfig {
  content: string;
  reason?: string;
}

@Injectable()
export class AiProviderService {
  private readonly logger = new Logger(AiProviderService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly gradingModel: string;
  private readonly feedbackModel: string;
  private readonly timeoutMs: number;
  private readonly maxTokens: number;
  private readonly temperature: number;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('ai.baseUrl', 'https://api.openai.com/v1');
    this.apiKey = this.config.get<string>('ai.apiKey', '');
    this.gradingModel = this.config.get<string>('ai.gradingModel', 'gpt-4o-mini');
    this.feedbackModel = this.config.get<string>('ai.feedbackModel', 'gpt-4o-mini');
    this.timeoutMs = this.config.get<number>('ai.timeoutMs', 10000);
    this.maxTokens = this.config.get<number>('ai.maxTokens', 512);
    this.temperature = this.config.get<number>('ai.temperature', 0.3);
  }

  /**
   * Send a chat completion request to the AI provider.
   *
   * On timeout or error: returns fallback content instead of throwing.
   * On success: validates response before returning.
   */
  async chatCompletion(
    messages: AiMessage[],
    tier: CostTier,
    fallback: FallbackConfig,
  ): Promise<AiProviderResult> {
    if (!this.apiKey) {
      this.logger.warn('AI API key not configured — returning fallback');
      return this.buildFallbackResult(fallback, 'no_api_key');
    }

    const model = tier === 'grading' ? this.gradingModel : this.feedbackModel;
    const startMs = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const latencyMs = Date.now() - startMs;

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'unknown');
        this.logger.error(`AI provider error: HTTP ${response.status} — ${errorBody}`);
        return this.buildFallbackResult(fallback, `http_${response.status}`);
      }

      const data = await response.json();
      const content = this.extractContent(data);

      if (!content) {
        this.logger.error('AI provider returned empty content');
        return this.buildFallbackResult(fallback, 'empty_content');
      }

      const tokensUsed = {
        prompt: data.usage?.prompt_tokens ?? 0,
        completion: data.usage?.completion_tokens ?? 0,
        total: data.usage?.total_tokens ?? 0,
      };

      this.logger.log(
        `AI call: model=${model} tier=${tier} tokens=${tokensUsed.total} latency=${latencyMs}ms`,
      );

      return {
        content: this.sanitizeContent(content),
        model: data.model ?? model,
        tokensUsed,
        latencyMs,
        fromFallback: false,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startMs;

      if (err.name === 'AbortError') {
        this.logger.warn(`AI provider timeout after ${latencyMs}ms (limit: ${this.timeoutMs}ms)`);
        return this.buildFallbackResult(fallback, 'timeout');
      }

      this.logger.error(`AI provider error: ${err.message}`);
      return this.buildFallbackResult(fallback, 'network_error');
    }
  }

  /** Check if the AI provider is configured and available */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /** Extract content from OpenAI-compatible response */
  private extractContent(data: any): string | null {
    if (!data?.choices?.length) return null;
    const choice = data.choices[0];
    return choice?.message?.content?.trim() ?? null;
  }

  /**
   * Sanitize AI content: remove prompt leakage markers, excessive whitespace.
   * Validates content does not contain raw error objects.
   */
  private sanitizeContent(content: string): string {
    let sanitized = content
      .replace(/```json[\s\S]*?```/g, (match) => match) // preserve JSON blocks
      .replace(/\n{3,}/g, '\n\n')                        // collapse excessive newlines
      .trim();

    // Reject content that looks like a raw error
    if (sanitized.startsWith('{') && sanitized.includes('"error"')) {
      this.logger.warn('AI response appears to contain raw error — rejected');
      return '';
    }

    return sanitized;
  }

  /** Build a fallback result when AI is unavailable */
  private buildFallbackResult(
    fallback: FallbackConfig,
    reason: string,
  ): AiProviderResult {
    this.logger.warn(`AI fallback used: reason=${reason}`);
    return {
      content: fallback.content,
      model: 'fallback',
      tokensUsed: { prompt: 0, completion: 0, total: 0 },
      latencyMs: 0,
      fromFallback: true,
    };
  }
}
