import { ConflictException, Logger, ServiceUnavailableException } from '@nestjs/common';

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 200;

const TRANSIENT_ERROR_CODES = new Set([
  '40001', '40P01', '57P03', '08006', '08001', '08004',
]);

const DUPLICATE_ERROR_CODES = new Set(['23505']);

export class BaseRepository {
  protected readonly logger: Logger;

  constructor(loggerContext: string) {
    this.logger = new Logger(loggerContext);
  }

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

        if (DUPLICATE_ERROR_CODES.has(code) || err?.message?.includes('UNIQUE constraint failed')) {
          throw new ConflictException({
            code: 'DUPLICATE_ENTRY',
            message: `Duplicate entry detected in ${context}`,
            details: { constraint: err?.constraint ?? err?.message },
          });
        }

        if (TRANSIENT_ERROR_CODES.has(code) && attempt < MAX_RETRIES) {
          const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          this.logger.warn(
            `Transient DB error in ${context} (code: ${code}), retry ${attempt + 1}/${MAX_RETRIES} after ${delay}ms`,
          );
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        this.logger.error(`DB error in ${context}: ${err.message}`, err.stack);
        break;
      }
    }

    if (lastError?.driverError?.code && TRANSIENT_ERROR_CODES.has(lastError.driverError.code)) {
      throw new ServiceUnavailableException({
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database temporarily unavailable. Please try again.',
      });
    }

    throw lastError;
  }
}
