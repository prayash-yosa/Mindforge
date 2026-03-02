/**
 * Mindforge Backend — Root Application Module
 *
 * Wires together all feature modules, global guards, throttling, and shared services.
 *
 * Architecture ref: §3.1 Components
 * Code Structure: /modules/{auth, student, attendance, activities}
 */

import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Config
import { AppConfigModule } from './config/config.module';

// Common
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AuthGuard } from './common/guards/auth.guard';
import { HttpsEnforceMiddleware } from './common/middleware/https-enforce.middleware';
import { JsonOnlyMiddleware } from './common/middleware/json-only.middleware';

// Database (Task 2.1)
import { DatabaseModule } from './database/database.module';

// Shared
import { AuditModule } from './shared/audit/audit.module';

// Seeders
import { SeederModule } from './database/seeders/seeder.module';

// AI (Task 4.1)
import { AiModule } from './modules/ai/ai.module';

// Feature modules
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { StudentModule } from './modules/student/student.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { SyllabusModule } from './modules/syllabus/syllabus.module';

@Module({
  imports: [
    // ── Configuration ─────────────────────────────────────────────
    AppConfigModule,

    // ── Global Rate Limiting ──────────────────────────────────────
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ([{
        ttl: (config.get<number>('throttle.ttl') ?? 60) * 1000,
        limit: config.get<number>('throttle.limit') ?? 100,
      }]),
    }),

    // ── Database (Task 2.1) ─────────────────────────────────────────
    DatabaseModule,

    // ── AI Provider (Task 4.1) ──────────────────────────────────
    AiModule,

    // ── Shared Services ───────────────────────────────────────────
    AuditModule,

    // ── Data Seeders (dev only) ──────────────────────────────────
    SeederModule,

    // ── Feature Modules ───────────────────────────────────────────
    HealthModule,
    AuthModule,
    StudentModule,
    AttendanceModule,
    ActivitiesModule,
    SyllabusModule,
  ],
  providers: [
    // ── Global Exception Filter ───────────────────────────────────
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },

    // ── Global Interceptors ───────────────────────────────────────
    { provide: APP_INTERCEPTOR, useClass: RequestIdInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },

    // ── Global Guards ─────────────────────────────────────────────
    // Auth guard — checks Bearer on all routes except @Public()
    { provide: APP_GUARD, useClass: AuthGuard },
    // Rate limiting guard
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply middleware to all routes
    consumer
      .apply(HttpsEnforceMiddleware, JsonOnlyMiddleware)
      .forRoutes('*');
  }
}
