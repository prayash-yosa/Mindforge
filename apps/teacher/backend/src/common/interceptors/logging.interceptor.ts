import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  Optional,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { MetricsService } from '../../modules/health/metrics.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');
  private readonly isProduction = process.env.NODE_ENV === 'production';

  constructor(
    @Optional() private readonly metricsService?: MetricsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, originalUrl } = request;
    const requestId = request.id ?? '-';
    const start = Date.now();

    const recordMetric = (statusCode: number) => {
      const elapsed = Date.now() - start;
      this.metricsService?.recordRequest({
        method,
        path: originalUrl,
        statusCode,
        durationMs: elapsed,
        timestamp: Date.now(),
      });
    };

    const logRequest = (statusCode: number) => {
      const elapsed = Date.now() - start;
      if (this.isProduction) {
        this.logger.log(
          JSON.stringify({
            requestId,
            method,
            path: originalUrl,
            statusCode,
            durationMs: elapsed,
            timestamp: new Date().toISOString(),
          }),
        );
      } else {
        this.logger.log(
          `[${requestId}] ${method} ${originalUrl} ${statusCode} ${elapsed}ms`,
        );
      }
    };

    return next.handle().pipe(
      tap(() => {
        const statusCode = response.statusCode;
        recordMetric(statusCode);
        logRequest(statusCode);
      }),
      catchError((err) => {
        const statusCode = err.status ?? err.statusCode ?? 500;
        recordMetric(statusCode);
        logRequest(statusCode);
        return throwError(() => err);
      }),
    );
  }
}
