/**
 * Mindforge Backend — Response Validator Service (Task 8.6)
 *
 * Validates every AI response for citations and on-topic alignment.
 * Rejects responses without valid chunk citations (fail closed).
 *
 * Architecture ref: §6.1 — ResponseValidatorService
 * Architecture ref: §7.1 — "Reject on missing citation"
 */

import { Injectable, Logger } from '@nestjs/common';

const NOT_FOUND_RESPONSE = 'Not found in provided material.';

export interface ValidationInput {
  aiResponse: string;
  availableChunkIds: string[];
}

export interface ValidationResult {
  isValid: boolean;
  validatedResponse: string;
  citedChunkIds: string[];
  rejectionReason: string | null;
}

@Injectable()
export class ResponseValidatorService {
  private readonly logger = new Logger(ResponseValidatorService.name);

  /**
   * Validate an AI response:
   * 1. If response is the standard "Not found" message, accept as-is
   * 2. Parse [chunk:{id}] citations
   * 3. Verify cited IDs exist in the retrieved set
   * 4. Reject if no valid citation found
   */
  validate(input: ValidationInput): ValidationResult {
    const response = input.aiResponse.trim();

    if (response === NOT_FOUND_RESPONSE || response.includes(NOT_FOUND_RESPONSE)) {
      return {
        isValid: true,
        validatedResponse: NOT_FOUND_RESPONSE,
        citedChunkIds: [],
        rejectionReason: null,
      };
    }

    const citedIds = this.extractCitations(response);
    const availableSet = new Set(input.availableChunkIds);
    const validCitedIds = citedIds.filter((id) => availableSet.has(id));

    if (validCitedIds.length === 0) {
      this.logger.warn(`Response rejected: no valid citations found. Cited: [${citedIds.join(', ')}], Available: [${input.availableChunkIds.join(', ')}]`);
      return {
        isValid: false,
        validatedResponse: NOT_FOUND_RESPONSE,
        citedChunkIds: [],
        rejectionReason: 'no_valid_citation',
      };
    }

    const invalidIds = citedIds.filter((id) => !availableSet.has(id));
    if (invalidIds.length > 0) {
      this.logger.warn(`Response contains ${invalidIds.length} invalid citation(s): [${invalidIds.join(', ')}]`);
    }

    if (this.containsSuspiciousContent(response)) {
      this.logger.warn('Response rejected: contains suspicious off-topic markers');
      return {
        isValid: false,
        validatedResponse: NOT_FOUND_RESPONSE,
        citedChunkIds: [],
        rejectionReason: 'off_topic_content',
      };
    }

    return {
      isValid: true,
      validatedResponse: response,
      citedChunkIds: validCitedIds,
      rejectionReason: null,
    };
  }

  /** Extract all [chunk:{id}] citations from the response */
  private extractCitations(text: string): string[] {
    const pattern = /\[chunk:([a-f0-9-]+)\]/gi;
    const ids: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      ids.push(match[1]);
    }
    return [...new Set(ids)];
  }

  /**
   * Heuristic check for content that suggests the AI ignored retrieval constraints.
   * Looks for phrases indicating general knowledge usage.
   */
  private containsSuspiciousContent(text: string): boolean {
    const markers = [
      'based on my training',
      'as a language model',
      'i don\'t have access',
      'according to my knowledge',
      'from my training data',
      'as an ai',
    ];
    const lower = text.toLowerCase();
    return markers.some((m) => lower.includes(m));
  }
}
