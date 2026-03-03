# Task 4.1 — Test Domain & Authoring APIs (Online + Offline)

**Sprint**: 4 — Tests & Evaluation Backend  
**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Backend — Tests  
**App**: Teacher  
**Status**: Done  
**Start Date**: 2026-03-02  
**Completed Date**: 2026-03-02  
**Estimate**: 2 SP

---

## Summary

Implemented test definition authoring APIs supporting both online daily quizzes and offline printable tests. Online quizzes enforce objective-only types (MCQ/FIB/T-F) at schema level. Full lifecycle management: create (draft) → publish → close. Tests are scoped by class, subject, and optionally linked to a lesson session.

---

## Acceptance Criteria — Checklist

| # | Criterion | Status | Implementation |
|---|-----------|--------|----------------|
| 1 | test_definition and related entities for online + offline | **Done** | TestDefinitionEntity with mode, questionTypes, status fields |
| 2 | Authoring APIs: create/update, scope (class, subject), marks, duration, question mix | **Done** | CreateTestDto + UpdateTestDto with full validation |
| 3 | Online quiz enforces objective types only (MCQ/FIB/T-F) at schema level | **Done** | validateQuestionTypes() rejects non-objective types for online mode |

---

## API Contract

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/v1/tests` | Create test definition (draft) |
| PATCH | `/v1/tests/:testId` | Update draft test |
| POST | `/v1/tests/:testId/publish` | Publish test (requires questions) |
| POST | `/v1/tests/:testId/close` | Close published test |
| GET | `/v1/tests/:testId` | Get test with questions |
| GET | `/v1/tests/class/:classId` | List tests by class (optional mode filter) |

---

## DTOs

| DTO | Fields | Validation |
|-----|--------|------------|
| CreateTestDto | classId, subject, title, mode, totalMarks, durationMinutes, questionTypes[], lessonSessionId?, scheduledAt? | mode enum (online/offline); marks 1-200; duration 5-300; types validated per mode |
| UpdateTestDto | title?, totalMarks?, durationMinutes?, questionTypes?, scheduledAt? | Only draft tests can be updated |
| PublishTestDto | scheduledAt? | Cannot publish without questions |

---

## Service Layer

`TestAuthoringService` handles:
- Class existence validation before creating tests
- Question type validation: online allows only `mcq`, `fill_in_blank`, `true_false`; offline allows all 7 types
- Lifecycle: draft → published (requires questions) → closed
- Delegates to `TestRepository` for all DB operations

---

## Verification

- **Build**: `npx nest build` — zero errors
- **Boot**: All 6 test authoring routes mapped at startup
- **Validation**: Invalid question types for online mode return descriptive errors
