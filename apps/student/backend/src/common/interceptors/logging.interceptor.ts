/**
 * Mindforge Backend — Logging Interceptor
 *
 * Logs incoming requests and outgoing responses with timing.
 * No PII in logs; includes request ID for correlation.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const now = Date.now();
    const requestId = (request as any).id ?? '-';

    return next.handle().pipe(
      tap(() => {
        const elapsed = Date.now() - now;
        this.logger.log(
          `${requestId} ${request.method} ${request.originalUrl} ${response.statusCode} ${elapsed}ms`,
        );
      }),
    );
  }
}
