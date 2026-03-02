/**
 * Mindforge Backend — Base Repository (Task 2.2)
 *
 * Shared error handling for all repositories:
 *   - Transient DB errors → retry with backoff
 *   - Duplicate/key constraint → 409 Conflict
 *   - Parameterized queries (TypeORM handles this)
 *
 * Checklist 2.2:
 *   [x] Transient DB errors handled with retry/backoff
 *   [x] Duplicate/key errors mapped to 409 or domain message
 */

import { ConflictException, Logger, ServiceUnavailableException } from '@nestjs/common';

/** Max retry attempts for transient DB errors */
const MAX_RETRIES = 3;
/** Initial backoff delay in ms (doubles each retry) */
const INITIAL_BACKOFF_MS = 200;

/**
 * Known transient error codes (PostgreSQL).
 * These are temporary failures that may succeed on retry.
 */
const TRANSIENT_ERROR_CODES = new Set([
  '40001', // serialization_failure
  '40P01', // deadlock_detected
  '57P03', // cannot_connect_now
  '08006', // connection_failure
  '08001', // sqlclient_unable_to_establish_sqlconnection
  '08004', // sqlserver_rejected_establishment_of_sqlconnection
]);

/** Known unique constraint violation codes */
const DUPLICATE_ERROR_CODES = new Set([
  '23505', // unique_violation (PostgreSQL)
]);

export class BaseRepository {
  protected readonly logger: Logger;

  constructor(loggerContext: string) {
    this.logger = new Logger(loggerContext);
  }

  /**
   * Execute a DB operation with retry/backoff for transient errors.
   * Maps duplicate key errors to 409 Conflict.
   */
  protected async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: string,
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (err: any) {
        lastError = err;
        const code = err?.driverError?.code ?? err?.code ?? '';

        // ── Duplicate / unique constraint ───────────────────
        if (DUPLICATE_ERROR_CODES.has(code) || err?.message?.includes('UNIQUE constraint failed')) {
          throw new ConflictException({
            code: 'DUPLICATE_ENTRY',
            message: `Duplicate entry detected in ${context}`,
            details: { constraint: err?.constraint ?? err?.message },
          });
        }

        // ── Transient error → retry with backoff ────────────
        if (TRANSIENT_ERROR_CODES.has(code) && attempt < MAX_RETRIES) {
          const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          this.logger.warn(
            `Transient DB error in ${context} (code: ${code}), retry ${attempt + 1}/${MAX_RETRIES} after ${delay}ms`,
          );
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        // ── Non-retryable error ─────────────────────────────
        this.logger.error(`DB error in ${context}: ${err.message}`, err.stack);
        break;
      }
    }

    // All retries exhausted or non-retryable error
    if (lastError?.driverError?.code && TRANSIENT_ERROR_CODES.has(lastError.driverError.code)) {
      throw new ServiceUnavailableException({
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database temporarily unavailable. Please try again.',
      });
    }

    throw lastError;
  }
}
