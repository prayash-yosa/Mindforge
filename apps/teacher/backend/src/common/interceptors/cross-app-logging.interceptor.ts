import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Reflector } from '@nestjs/core';

@Injectable()
export class CrossAppLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('CrossApp');

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isCrossApp = this.reflector.get<boolean>(
      'isCrossApp',
      context.getHandler(),
    );
    if (!isCrossApp) return next.handle();

    const request = context.switchToHttp().getRequest();
    const sourceApp = request.headers['x-source-app'] ?? 'unknown';
    const { method, originalUrl } = request;
    const requestId = request.id ?? '-';
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const elapsed = Date.now() - start;
        this.logger.log(
          `[${requestId}] source=${sourceApp} ${method} ${originalUrl} ${elapsed}ms`,
        );
      }),
    );
  }
}
