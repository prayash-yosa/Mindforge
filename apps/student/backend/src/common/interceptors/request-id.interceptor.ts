/**
 * Mindforge Backend — Request ID Interceptor
 *
 * Assigns a unique request ID (UUID v4) to every incoming request.
 * Sets X-Request-Id response header for client-side correlation.
 *
 * Architecture ref: §6 "Log errors with request id"
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const requestId = (request.headers['x-request-id'] as string) ?? uuidv4();
    (request as any).id = requestId;
    response.setHeader('X-Request-Id', requestId);

    return next.handle();
  }
}
