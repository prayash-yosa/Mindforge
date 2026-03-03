import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import {
  TeacherEntity,
  ClassEntity,
  ClassSessionEntity,
  ClassStudentEntity,
  AttendanceRecordEntity,
  SyllabusDocumentEntity,
  LessonSessionEntity,
  TestDefinitionEntity,
  TestQuestionEntity,
  TestAttemptEntity,
  OfflineMarkEntryEntity,
  NotificationEventEntity,
} from './entities';

import {
  TeacherRepository,
  ClassRepository,
  AttendanceRepository,
  SyllabusRepository,
  TestRepository,
  NotificationRepository,
} from './repositories';

export const ALL_ENTITIES = [
  TeacherEntity,
  ClassEntity,
  ClassSessionEntity,
  ClassStudentEntity,
  AttendanceRecordEntity,
  SyllabusDocumentEntity,
  LessonSessionEntity,
  TestDefinitionEntity,
  TestQuestionEntity,
  TestAttemptEntity,
  OfflineMarkEntryEntity,
  NotificationEventEntity,
];

export const ALL_REPOSITORIES = [
  TeacherRepository,
  ClassRepository,
  AttendanceRepository,
  SyllabusRepository,
  TestRepository,
  NotificationRepository,
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

        if (dbUrl || isProduction) {
          return {
            type: 'postgres' as const,
            url: dbUrl,
            host: config.get<string>('database.host') ?? 'localhost',
            port: config.get<number>('database.port') ?? 5432,
            username: config.get<string>('database.username') ?? 'mindforge',
            password: config.get<string>('database.password') ?? '',
            database: config.get<string>('database.name') ?? 'mindforge_teacher',
            entities: ALL_ENTITIES,
            synchronize: false,
            migrations: ['dist/database/migrations/*.js'],
            migrationsRun: true,
            logging: isProduction ? ['error'] : ['error', 'warn', 'schema'],
            retryAttempts: 3,
            retryDelay: 3000,
          };
        }

        return {
          type: 'better-sqlite3' as const,
          database: config.get<string>('database.sqlitePath') ?? ':memory:',
          entities: ALL_ENTITIES,
          synchronize: true,
          logging: ['error', 'warn'],
        };
      },
    }),

    TypeOrmModule.forFeature(ALL_ENTITIES),
  ],
  providers: [...ALL_REPOSITORIES],
  exports: [TypeOrmModule.forFeature(ALL_ENTITIES), ...ALL_REPOSITORIES],
})
export class DatabaseModule {}
