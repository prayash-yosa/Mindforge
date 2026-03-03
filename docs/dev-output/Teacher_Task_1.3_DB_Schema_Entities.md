# Task 1.3 — Teacher DB Schema & Migrations (Core Tables)

**Sprint**: 1 — Workspace Integration & Teacher Service Foundation  
**Labels**: Type: Hardening | AI: Non-AI | Risk: Low | Area: Teacher Backend — Data  
**App**: Teacher  
**Status**: Done  
**Start Date**: 2026-03-02  
**Completed Date**: 2026-03-02  
**Estimate**: 3 SP

---

## Summary

Defined and implemented all 12 core Teacher domain entities with TypeORM, along with 6 domain-grouped repositories. Includes proper indexes, foreign key constraints, cascading deletes, and unique constraints per the architecture specification. Development uses SQLite with `synchronize: true`; production uses PostgreSQL with versioned migrations.

---

## Acceptance Criteria — Checklist

| # | Criterion | Status | Implementation |
|---|-----------|--------|----------------|
| 1 | Define and migrate all core tables per architecture v1 | **Done** | 12 entities mapped to tables with all fields from architecture spec |
| 2 | Add indexes for class_session, student_id, dates, and foreign keys | **Done** | Composite and single-column indexes on all query-critical fields |
| 3 | Migrations are idempotent and integrated into CI/CD | **Done** | `data-source.ts` for CLI; `synchronize: true` in dev; `migrationsRun: true` in prod |

---

## Entity Schema

### 1. `teachers`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| external_id | VARCHAR | Unique, Indexed |
| display_name | VARCHAR | Not null |
| email | VARCHAR | Nullable |
| phone | VARCHAR | Nullable |
| subjects | TEXT (simple-array) | Nullable |
| password_hash | VARCHAR | Nullable |
| is_active | BOOLEAN | Default `true` |
| created_at | DATETIME | Auto |
| updated_at | DATETIME | Auto |

### 2. `classes`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| grade | VARCHAR | Indexed |
| section | VARCHAR | — |
| subject | VARCHAR | — |
| academic_year | VARCHAR | — |
| teacher_id | UUID (FK → teachers) | Indexed, CASCADE |
| is_active | BOOLEAN | Default `true` |
| **Unique** | `(grade, section, subject, academic_year)` | Composite unique |

### 3. `class_sessions`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| class_id | UUID (FK → classes) | Indexed, CASCADE |
| teacher_id | UUID (FK → teachers) | Indexed, CASCADE |
| subject | VARCHAR | — |
| scheduled_at | DATETIME | Indexed |
| duration_minutes | INTEGER | Default `60` |
| editable_until | DATETIME | — |
| is_attendance_taken | BOOLEAN | Default `false` |
| **Index** | `(class_id, scheduled_at)` | Composite |

### 4. `class_students`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| class_id | UUID (FK → classes) | Indexed, CASCADE |
| student_id | VARCHAR | Indexed (refs student UID) |
| student_name | VARCHAR | — |
| roll_number | VARCHAR | Nullable |
| is_active | BOOLEAN | Default `true` |
| enrolled_at | DATETIME | Auto |
| **Unique** | `(class_id, student_id)` | Composite unique |

### 5. `attendance_records`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| class_session_id | UUID (FK → class_sessions) | Indexed, CASCADE |
| student_id | VARCHAR | Indexed |
| status | VARCHAR | Default `'absent'` |
| notes | VARCHAR | Nullable |
| marked_by | VARCHAR | — |
| marked_at | DATETIME | Auto |
| updated_at | DATETIME | Auto |
| **Unique** | `(class_session_id, student_id)` | Composite unique |

### 6. `syllabus_documents`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| class_id | UUID (FK → classes) | Indexed, CASCADE |
| subject | VARCHAR | — |
| file_name | VARCHAR | — |
| file_type | VARCHAR | — |
| storage_path | VARCHAR | — |
| file_size_bytes | INTEGER | Default `0` |
| status | VARCHAR | Indexed, Default `'pending'` |
| error_message | VARCHAR | Nullable |
| uploaded_by | VARCHAR | — |
| class_date | DATE | Nullable |
| duration_minutes | INTEGER | Default `60` |
| **Index** | `(class_id, subject)` | Composite |

### 7. `lesson_sessions`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| syllabus_document_id | UUID (FK → syllabus_documents) | Indexed, CASCADE |
| class_id | UUID (FK → classes) | Indexed, CASCADE |
| subject | VARCHAR | — |
| concept_summary | TEXT | — |
| learning_objectives | TEXT | JSON string |
| has_numericals | BOOLEAN | Default `false` |
| chapters | TEXT | Nullable, JSON |
| topics | TEXT | Nullable, JSON |
| raw_text | TEXT | Nullable |
| **Index** | `(class_id, subject)` | Composite |

### 8. `test_definitions`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| class_id | UUID (FK → classes) | Indexed, CASCADE |
| subject | VARCHAR | — |
| title | VARCHAR | — |
| mode | VARCHAR | Indexed (`'online'` / `'offline'`) |
| status | VARCHAR | Default `'draft'` |
| total_marks | INTEGER | — |
| duration_minutes | INTEGER | — |
| question_types | TEXT | JSON array |
| lesson_session_id | UUID (FK → lesson_sessions) | Nullable, SET NULL |
| scheduled_at | DATETIME | Nullable |
| created_by | VARCHAR | — |
| **Index** | `(class_id, subject, mode)` | Composite |

### 9. `test_questions`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| test_definition_id | UUID (FK → test_definitions) | Indexed, CASCADE |
| question_type | VARCHAR | — |
| question_text | TEXT | — |
| options | TEXT | Nullable (JSON for MCQ) |
| correct_answer | TEXT | — |
| explanation | TEXT | Nullable |
| marks | INTEGER | — |
| order_index | INTEGER | — |
| **Index** | `(test_definition_id, order_index)` | Composite |

### 10. `test_attempts`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| test_definition_id | UUID (FK → test_definitions) | Indexed, CASCADE |
| student_id | VARCHAR | Indexed |
| status | VARCHAR | Default `'in_progress'` |
| started_at | DATETIME | — |
| submitted_at | DATETIME | Nullable |
| total_marks | INTEGER | Default `0` |
| scored_marks | REAL | Default `0` |
| attempted_count | INTEGER | Default `0` |
| not_attempted_count | INTEGER | Default `0` |
| answers | TEXT | Nullable (JSON) |
| **Unique** | `(test_definition_id, student_id)` | Composite unique |

### 11. `offline_mark_entries`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| test_definition_id | UUID (FK → test_definitions) | Indexed, CASCADE |
| student_id | VARCHAR | Indexed |
| section_label | VARCHAR | Nullable |
| question_index | INTEGER | Nullable |
| marks_obtained | REAL | — |
| max_marks | REAL | — |
| entered_by | VARCHAR | — |
| **Index** | `(test_definition_id, student_id)` | Composite |

### 12. `notification_events`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| category | VARCHAR | Indexed |
| priority | VARCHAR | Default `'medium'` |
| title | VARCHAR | — |
| body | TEXT | — |
| recipient_role | VARCHAR | Indexed |
| recipient_id | VARCHAR | Nullable, Indexed |
| payload | TEXT | Nullable (JSON) |
| is_read | BOOLEAN | Default `false` |
| is_delivered | BOOLEAN | Default `false` |
| **Index** | `(recipient_role, recipient_id, is_read)` | Composite |

---

## Repositories

| Repository | Entities Covered | Key Methods |
|-----------|-----------------|-------------|
| `TeacherRepository` | teachers | findById, findByExternalId, create, update, findAll |
| `ClassRepository` | classes, class_sessions, class_students | createClass, findClassesByTeacher, createSession, findSessionsByClass, addStudentToClass, findStudentsByClass |
| `AttendanceRepository` | attendance_records | markAttendance, bulkMark, findBySession, findByStudentAndDateRange, countAbsentByStudentInWeek |
| `SyllabusRepository` | syllabus_documents, lesson_sessions | createDocument, findPendingDocuments, updateDocumentStatus, createLesson, findLessonsByClass |
| `TestRepository` | test_definitions, test_questions, test_attempts, offline_mark_entries | createDefinition, createQuestions, createAttempt, findAttemptsByTest, createMarkEntries |
| `NotificationRepository` | notification_events | create, bulkCreate, findByRecipient, markAsRead, markAllAsRead, countUnread |

All repositories extend `BaseRepository` with retry/backoff for transient DB errors and duplicate key detection.

---

## Dev Seeder

Seeds development data on startup (skips if data exists):

- **1 Teacher**: Ms. Priya Sharma (T001, Mathematics + Science)
- **2 Classes**: 8A Mathematics, 8B Science (2025-2026)
- **5 Students per class**: Aarav (12131), Ankita (12132), Rohan (12133), Diya (12134), Kabir (12135)

Student IDs match the Student app's UID system for future cross-app sync.

---

## Verification

| Test | Expected | Result |
|------|----------|--------|
| `nest build` | Zero TypeScript errors | **Pass** |
| Service boots with SQLite | All 12 tables created (synchronize) | **Pass** |
| Dev seeder runs | Teacher + classes + students created | **Pass** |
| `data-source.ts` exports for CLI | TypeORM CLI can run migrations | **Pass** |
