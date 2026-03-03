import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Performance');
  private readonly slowThresholdMs: number;

  constructor(private readonly config: ConfigService) {
    this.slowThresholdMs =
      this.config.get<number>('performance.slowRequestThresholdMs') ?? 500;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, originalUrl } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const elapsed = Date.now() - start;
        if (elapsed > this.slowThresholdMs) {
          const requestId = request.id ?? '-';
          this.logger.warn(
            `SLOW REQUEST [${requestId}] ${method} ${originalUrl} took ${elapsed}ms (threshold: ${this.slowThresholdMs}ms)`,
          );
        }
      }),
    );
  }
}
