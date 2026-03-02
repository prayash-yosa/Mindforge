/**
 * Mindforge Backend — Global HTTP Exception Filter
 *
 * Catches ALL exceptions (HttpException, validation, unknown) and returns
 * the consistent error shape: { code, message, details? }
 *
 * Architecture ref: §6 Error Handling Strategy
 * Checklist 1.1: "Error response shape { code, message, details? } for 400–500"
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponseDto } from '../dto/error-response.dto';

/** Map of HTTP status codes to default error codes */
const STATUS_CODE_MAP: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  415: 'UNSUPPORTED_MEDIA_TYPE',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_ERROR',
  503: 'SERVICE_UNAVAILABLE',
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Internal server error';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exResponse = exception.getResponse();

      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (typeof exResponse === 'object' && exResponse !== null) {
        const res = exResponse as Record<string, any>;

        // NestJS class-validator pipe returns { message: string[], error: string }
        if (Array.isArray(res.message)) {
          code = 'VALIDATION_ERROR';
          message = 'Request validation failed';
          details = res.message.map((msg: string) => ({
            message: msg,
          }));
        } else {
          message = res.message ?? message;
          code = res.code ?? STATUS_CODE_MAP[statusCode] ?? code;
          details = res.details;
        }
      }

      // Preserve code from custom exceptions
      if ((exception as any).code) {
        code = (exception as any).code;
      }
    }

    // Fallback code from status
    if (code === 'INTERNAL_ERROR' && statusCode !== 500) {
      code = STATUS_CODE_MAP[statusCode] ?? `ERROR_${statusCode}`;
    }

    // ── Logging (no PII; include request ID) ────────────────────
    const requestId = (request as any).id ?? request.headers['x-request-id'] ?? '-';
    const logPayload = {
      requestId,
      statusCode,
      code,
      message,
      method: request.method,
      path: request.originalUrl,
    };

    if (statusCode >= 500) {
      this.logger.error(JSON.stringify(logPayload), exception instanceof Error ? exception.stack : '');
    } else {
      this.logger.warn(JSON.stringify(logPayload));
    }

    // ── Build response ──────────────────────────────────────────
    const body: ErrorResponseDto = { code, message };
    if (details !== undefined) {
      body.details = details;
    }

    response.status(statusCode).json(body);
  }
}
