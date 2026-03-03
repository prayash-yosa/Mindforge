import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AppConfigModule } from './config/config.module';

import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';
import { CrossAppLoggingInterceptor } from './common/interceptors/cross-app-logging.interceptor';
import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HttpsEnforceMiddleware } from './common/middleware/https-enforce.middleware';
import { JsonOnlyMiddleware } from './common/middleware/json-only.middleware';

import { DatabaseModule } from './database/database.module';

import { AuditModule } from './shared/audit/audit.module';
import { AiGovernanceModule } from './shared/ai-governance/ai-governance.module';

import { SeederModule } from './database/seeders/seeder.module';

import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClassAttendanceModule } from './modules/class-attendance/class-attendance.module';
import { SyllabusModule } from './modules/syllabus/syllabus.module';
import { TestsModule } from './modules/tests/tests.module';
import { EvaluationModule } from './modules/evaluation/evaluation.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    AppConfigModule,

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ([{
        ttl: (config.get<number>('throttle.ttl') ?? 60) * 1000,
        limit: config.get<number>('throttle.limit') ?? 100,
      }]),
    }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: { expiresIn: (config.get<string>('jwt.expiresIn') ?? '8h') as any },
      }),
    }),

    DatabaseModule,
    AuditModule,
    AiGovernanceModule,
    SeederModule,

    HealthModule,
    AuthModule,
    ClassAttendanceModule,
    SyllabusModule,
    TestsModule,
    EvaluationModule,
    AnalyticsModule,
    NotificationsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: RequestIdInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: PerformanceInterceptor },
    { provide: APP_INTERCEPTOR, useClass: CrossAppLoggingInterceptor },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(HttpsEnforceMiddleware, JsonOnlyMiddleware)
      .forRoutes('*');
  }
}
