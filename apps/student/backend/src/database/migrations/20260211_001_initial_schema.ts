/**
 * Mindforge Backend — Initial Database Schema Migration (Task 2.1)
 *
 * Creates all tables per Architecture §5.1:
 *   students, syllabus_metadata, teaching_feed, activities, questions,
 *   responses, attendance, doubt_threads, doubt_messages, sessions, audit_log
 *
 * Indexes on: student_id, activity_id, date (attendance), syllabus keys.
 *
 * This migration is idempotent — each table is created with IF NOT EXISTS
 * semantics (via TypeORM). Can be re-run safely.
 */

import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class InitialSchema20260211001 implements MigrationInterface {
  name = 'InitialSchema20260211001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── students ────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'students',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'external_id', type: 'varchar', isUnique: true },
          { name: 'display_name', type: 'varchar' },
          { name: 'class', type: 'varchar' },
          { name: 'board', type: 'varchar' },
          { name: 'school', type: 'varchar', isNullable: true },
          { name: 'mpin_hash', type: 'varchar' },
          { name: 'consent_ai', type: 'boolean', default: false },
          { name: 'consent_data', type: 'boolean', default: false },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );
    await queryRunner.createIndex('students', new TableIndex({ columnNames: ['external_id'] }));
    await queryRunner.createIndex('students', new TableIndex({ columnNames: ['class'] }));

    // ── syllabus_metadata ───────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'syllabus_metadata',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'class', type: 'varchar' },
          { name: 'board', type: 'varchar' },
          { name: 'subject', type: 'varchar' },
          { name: 'chapter', type: 'varchar' },
          { name: 'topic', type: 'varchar' },
          { name: 'sort_order', type: 'int', default: 0 },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );
    await queryRunner.createIndex('syllabus_metadata', new TableIndex({ columnNames: ['class', 'board', 'subject'] }));
    await queryRunner.createIndex('syllabus_metadata', new TableIndex({ columnNames: ['class', 'board', 'subject', 'chapter'] }));

    // ── teaching_feed ───────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'teaching_feed',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'class', type: 'varchar' },
          { name: 'board', type: 'varchar', isNullable: true },
          { name: 'subject', type: 'varchar', isNullable: true },
          { name: 'date', type: 'date' },
          { name: 'summary', type: 'text' },
          { name: 'key_points', type: 'text', isNullable: true },
          { name: 'source_ref', type: 'varchar', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );
    await queryRunner.createIndex('teaching_feed', new TableIndex({ columnNames: ['class', 'date'] }));
    await queryRunner.createIndex('teaching_feed', new TableIndex({ columnNames: ['date'] }));

    // ── activities ──────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'activities',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'student_id', type: 'uuid' },
          { name: 'type', type: 'varchar' },
          { name: 'syllabus_id', type: 'uuid', isNullable: true },
          { name: 'title', type: 'varchar' },
          { name: 'status', type: 'varchar', default: "'pending'" },
          { name: 'question_count', type: 'int', default: 0 },
          { name: 'estimated_minutes', type: 'int', isNullable: true },
          { name: 'due_at', type: 'timestamp', isNullable: true },
          { name: 'started_at', type: 'timestamp', isNullable: true },
          { name: 'completed_at', type: 'timestamp', isNullable: true },
          { name: 'score', type: 'real', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );
    await queryRunner.createIndex('activities', new TableIndex({ columnNames: ['student_id'] }));
    await queryRunner.createIndex('activities', new TableIndex({ columnNames: ['student_id', 'status'] }));
    await queryRunner.createIndex('activities', new TableIndex({ columnNames: ['student_id', 'type'] }));
    await queryRunner.createForeignKey('activities', new TableForeignKey({ columnNames: ['student_id'], referencedTableName: 'students', referencedColumnNames: ['id'], onDelete: 'CASCADE' }));
    await queryRunner.createForeignKey('activities', new TableForeignKey({ columnNames: ['syllabus_id'], referencedTableName: 'syllabus_metadata', referencedColumnNames: ['id'], onDelete: 'SET NULL' }));

    // ── questions ───────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'questions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'activity_id', type: 'uuid' },
          { name: 'syllabus_id', type: 'uuid', isNullable: true },
          { name: 'type', type: 'varchar' },
          { name: 'content', type: 'text' },
          { name: 'options', type: 'text', isNullable: true },
          { name: 'correct_answer', type: 'text', isNullable: true },
          { name: 'rubric', type: 'text', isNullable: true },
          { name: 'difficulty', type: 'int', default: 3 },
          { name: 'sort_order', type: 'int', default: 0 },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );
    await queryRunner.createIndex('questions', new TableIndex({ columnNames: ['activity_id'] }));
    await queryRunner.createForeignKey('questions', new TableForeignKey({ columnNames: ['activity_id'], referencedTableName: 'activities', referencedColumnNames: ['id'], onDelete: 'CASCADE' }));
    await queryRunner.createForeignKey('questions', new TableForeignKey({ columnNames: ['syllabus_id'], referencedTableName: 'syllabus_metadata', referencedColumnNames: ['id'], onDelete: 'SET NULL' }));

    // ── responses ───────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'responses',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'student_id', type: 'uuid' },
          { name: 'activity_id', type: 'uuid' },
          { name: 'question_id', type: 'uuid' },
          { name: 'answer', type: 'text' },
          { name: 'is_correct', type: 'boolean', isNullable: true },
          { name: 'score', type: 'real', isNullable: true },
          { name: 'feedback_level', type: 'varchar', default: "'none'" },
          { name: 'ai_conversation_ref', type: 'varchar', isNullable: true },
          { name: 'ai_feedback', type: 'text', isNullable: true },
          { name: 'attempt_number', type: 'int', default: 1 },
          { name: 'submitted_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );
    await queryRunner.createIndex('responses', new TableIndex({ columnNames: ['student_id'] }));
    await queryRunner.createIndex('responses', new TableIndex({ columnNames: ['student_id', 'activity_id'] }));
    await queryRunner.createIndex('responses', new TableIndex({ columnNames: ['student_id', 'question_id'] }));
    await queryRunner.createForeignKey('responses', new TableForeignKey({ columnNames: ['student_id'], referencedTableName: 'students', referencedColumnNames: ['id'], onDelete: 'CASCADE' }));
    await queryRunner.createForeignKey('responses', new TableForeignKey({ columnNames: ['activity_id'], referencedTableName: 'activities', referencedColumnNames: ['id'], onDelete: 'CASCADE' }));
    await queryRunner.createForeignKey('responses', new TableForeignKey({ columnNames: ['question_id'], referencedTableName: 'questions', referencedColumnNames: ['id'], onDelete: 'CASCADE' }));

    // ── attendance ──────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'attendance',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'student_id', type: 'uuid' },
          { name: 'date', type: 'date' },
          { name: 'status', type: 'varchar' },
          { name: 'source_label', type: 'varchar', isNullable: true },
          { name: 'period', type: 'varchar', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );
    await queryRunner.createIndex('attendance', new TableIndex({ columnNames: ['student_id'] }));
    await queryRunner.createIndex('attendance', new TableIndex({ columnNames: ['student_id', 'date'] }));
    await queryRunner.createIndex('attendance', new TableIndex({ columnNames: ['date'] }));
    await queryRunner.createForeignKey('attendance', new TableForeignKey({ columnNames: ['student_id'], referencedTableName: 'students', referencedColumnNames: ['id'], onDelete: 'CASCADE' }));

    // ── doubt_threads ───────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'doubt_threads',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'student_id', type: 'uuid' },
          { name: 'syllabus_class', type: 'varchar', isNullable: true },
          { name: 'syllabus_subject', type: 'varchar', isNullable: true },
          { name: 'syllabus_chapter', type: 'varchar', isNullable: true },
          { name: 'syllabus_topic', type: 'varchar', isNullable: true },
          { name: 'title', type: 'varchar', isNullable: true },
          { name: 'is_resolved', type: 'boolean', default: false },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );
    await queryRunner.createIndex('doubt_threads', new TableIndex({ columnNames: ['student_id'] }));
    await queryRunner.createForeignKey('doubt_threads', new TableForeignKey({ columnNames: ['student_id'], referencedTableName: 'students', referencedColumnNames: ['id'], onDelete: 'CASCADE' }));

    // ── doubt_messages ──────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'doubt_messages',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'thread_id', type: 'uuid' },
          { name: 'role', type: 'varchar' },
          { name: 'content', type: 'text' },
          { name: 'ai_model', type: 'varchar', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );
    await queryRunner.createIndex('doubt_messages', new TableIndex({ columnNames: ['thread_id'] }));
    await queryRunner.createForeignKey('doubt_messages', new TableForeignKey({ columnNames: ['thread_id'], referencedTableName: 'doubt_threads', referencedColumnNames: ['id'], onDelete: 'CASCADE' }));

    // ── sessions ────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'sessions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'student_id', type: 'uuid' },
          { name: 'token', type: 'text' },
          { name: 'device_info', type: 'varchar', isNullable: true },
          { name: 'ip_address', type: 'varchar', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'expires_at', type: 'timestamp' },
          { name: 'is_revoked', type: 'boolean', default: false },
        ],
      }),
      true,
    );
    await queryRunner.createIndex('sessions', new TableIndex({ columnNames: ['student_id'] }));
    await queryRunner.createForeignKey('sessions', new TableForeignKey({ columnNames: ['student_id'], referencedTableName: 'students', referencedColumnNames: ['id'], onDelete: 'CASCADE' }));

    // ── audit_log ───────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'audit_log',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'request_id', type: 'varchar' },
          { name: 'action', type: 'varchar' },
          { name: 'student_id', type: 'varchar', isNullable: true },
          { name: 'ip_address', type: 'varchar', isNullable: true },
          { name: 'metadata', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );
    await queryRunner.createIndex('audit_log', new TableIndex({ columnNames: ['action'] }));
    await queryRunner.createIndex('audit_log', new TableIndex({ columnNames: ['student_id'] }));
    await queryRunner.createIndex('audit_log', new TableIndex({ columnNames: ['created_at'] }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse dependency order
    await queryRunner.dropTable('audit_log', true);
    await queryRunner.dropTable('sessions', true);
    await queryRunner.dropTable('doubt_messages', true);
    await queryRunner.dropTable('doubt_threads', true);
    await queryRunner.dropTable('attendance', true);
    await queryRunner.dropTable('responses', true);
    await queryRunner.dropTable('questions', true);
    await queryRunner.dropTable('activities', true);
    await queryRunner.dropTable('teaching_feed', true);
    await queryRunner.dropTable('syllabus_metadata', true);
    await queryRunner.dropTable('students', true);
  }
}
