/**
 * Mindforge Backend — Database Module (Task 2.1)
 *
 * Configures TypeORM with:
 *   - PostgreSQL for production
 *   - SQLite (better-sqlite3) for development (no external DB needed)
 *
 * Architecture ref: §4 Technology Stack — "PostgreSQL (primary)"
 * Architecture ref: §5.1 Database — all entity tables
 *
 * Migrations are versioned and idempotent. In dev, synchronize is enabled
 * for rapid iteration. In production, synchronize is OFF and migrations
 * are applied via CI/deploy.
 */

import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Entities
import { StudentEntity } from './entities/student.entity';
import { SyllabusMetadataEntity } from './entities/syllabus-metadata.entity';
import { TeachingFeedEntity } from './entities/teaching-feed.entity';
import { ActivityEntity } from './entities/activity.entity';
import { QuestionEntity } from './entities/question.entity';
import { ResponseEntity } from './entities/response.entity';
import { AttendanceEntity } from './entities/attendance.entity';
import { DoubtThreadEntity } from './entities/doubt-thread.entity';
import { DoubtMessageEntity } from './entities/doubt-message.entity';
import { SessionEntity } from './entities/session.entity';
import { AuditLogEntity } from './entities/audit-log.entity';
import { TeacherMaterialEntity } from './entities/teacher-material.entity';
import { TeacherMaterialChunkEntity } from './entities/teacher-material-chunk.entity';
import { AiUsageLogEntity } from './entities/ai-usage-log.entity';

// Repositories
import { StudentRepository } from './repositories/student.repository';
import { SyllabusRepository } from './repositories/syllabus.repository';
import { TeachingFeedRepository } from './repositories/teaching-feed.repository';
import { ActivityRepository } from './repositories/activity.repository';
import { QuestionRepository } from './repositories/question.repository';
import { ResponseRepository } from './repositories/response.repository';
import { AttendanceRepository } from './repositories/attendance.repository';
import { DoubtRepository } from './repositories/doubt.repository';
import { SessionRepository } from './repositories/session.repository';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { TeacherContentRepository } from './repositories/teacher-content.repository';
import { EmbeddingsRepository } from './repositories/embeddings.repository';
import { AiUsageRepository } from './repositories/ai-usage.repository';

/** All entity classes for TypeORM */
export const ALL_ENTITIES = [
  StudentEntity,
  SyllabusMetadataEntity,
  TeachingFeedEntity,
  ActivityEntity,
  QuestionEntity,
  ResponseEntity,
  AttendanceEntity,
  DoubtThreadEntity,
  DoubtMessageEntity,
  SessionEntity,
  AuditLogEntity,
  TeacherMaterialEntity,
  TeacherMaterialChunkEntity,
  AiUsageLogEntity,
];

/** All repository providers */
export const ALL_REPOSITORIES = [
  StudentRepository,
  SyllabusRepository,
  TeachingFeedRepository,
  ActivityRepository,
  QuestionRepository,
  ResponseRepository,
  AttendanceRepository,
  DoubtRepository,
  SessionRepository,
  AuditLogRepository,
  TeacherContentRepository,
  EmbeddingsRepository,
  AiUsageRepository,
];

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = config.get<boolean>('isProduction');
        const dbUrl = config.get<string>('database.url');

        // ── PostgreSQL (production / when DATABASE_URL is set) ───
        if (dbUrl || isProduction) {
          return {
            type: 'postgres' as const,
            url: dbUrl,
            host: config.get<string>('database.host') ?? 'localhost',
            port: config.get<number>('database.port') ?? 5432,
            username: config.get<string>('database.username') ?? 'mindforge',
            password: config.get<string>('database.password') ?? '',
            database: config.get<string>('database.name') ?? 'mindforge',
            entities: ALL_ENTITIES,
            synchronize: false, // NEVER synchronize in production
            migrations: ['dist/database/migrations/*.js'],
            migrationsRun: true, // Auto-run pending migrations on startup
            logging: isProduction ? ['error'] : ['error', 'warn', 'schema'],
            retryAttempts: 3,
            retryDelay: 3000,
          };
        }

        // ── SQLite (development — no external DB needed) ──────────
        return {
          type: 'better-sqlite3' as const,
          database: config.get<string>('database.sqlitePath') ?? ':memory:',
          entities: ALL_ENTITIES,
          synchronize: true, // Auto-create tables in dev
          logging: ['error', 'warn'],
        };
      },
    }),

    // Register all entities for injection
    TypeOrmModule.forFeature(ALL_ENTITIES),
  ],
  providers: [...ALL_REPOSITORIES],
  exports: [TypeOrmModule.forFeature(ALL_ENTITIES), ...ALL_REPOSITORIES],
})
export class DatabaseModule {}
