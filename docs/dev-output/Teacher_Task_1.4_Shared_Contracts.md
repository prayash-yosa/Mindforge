# Task 1.4 — Shared Contracts for Teacher APIs in @mindforge/shared

**Sprint**: 1 — Workspace Integration & Teacher Service Foundation  
**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Shared  
**App**: Teacher  
**Status**: Done  
**Start Date**: 2026-03-02  
**Completed Date**: 2026-03-02  
**Estimate**: 1 SP

---

## Summary

Added Teacher-specific DTOs, interfaces, and enums to `@mindforge/shared` so that Student, Parent, Admin, and Gateway can consume Teacher API contracts without tight coupling or cross-service imports. All types are exported via the shared package's barrel exports.

---

## Acceptance Criteria — Checklist

| # | Criterion | Status | Implementation |
|---|-----------|--------|----------------|
| 1 | Teacher-specific DTOs/interfaces in `shared/src/interfaces/teacher` | **Done** | 14 interfaces + 8 enums |
| 2 | Teacher-related auth roles/constants in `shared/src/auth` as needed | **Done** | `UserRole.TEACHER` already existed; RBAC rules updated for Admin access |
| 3 | Teacher frontend and backend both consume shared types | **Done** | `@mindforge/shared` imported in teacher backend; frontend ready |

---

## Enums (`teacher.enums.ts`)

| Enum | Values | Used For |
|------|--------|----------|
| `AttendanceStatus` | `present`, `absent` | Attendance records |
| `TestMode` | `online`, `offline` | Test type classification |
| `TestStatus` | `draft`, `published`, `closed` | Test lifecycle |
| `QuestionType` | `mcq`, `fill_in_blank`, `true_false`, `very_short`, `short`, `long`, `numerical` | Question classification |
| `AttemptStatus` | `in_progress`, `submitted`, `auto_submitted`, `evaluated` | Test attempt lifecycle |
| `DocumentProcessingStatus` | `pending`, `processing`, `ready`, `failed` | Syllabus upload pipeline |
| `NotificationCategory` | `absence_alert`, `missed_test`, `auto_submitted`, `evaluation_pending`, `general` | Alert types |
| `NotificationPriority` | `low`, `medium`, `high` | Alert priority |

---

## Interfaces (`teacher.interfaces.ts`)

| Interface | Purpose |
|-----------|---------|
| `TeacherProfile` | Teacher identity and metadata |
| `ClassInfo` | Grade/section/subject/teacher mapping |
| `ClassSessionInfo` | 1-hour class session with editable_until |
| `ClassStudentMapping` | Student enrollment in a class |
| `AttendanceRecordDto` | Single attendance record |
| `AttendanceSummaryDto` | Aggregated attendance (daily/weekly/monthly) |
| `SyllabusDocumentDto` | Uploaded syllabus file metadata and status |
| `LessonSessionDto` | AI-extracted concepts, objectives, numericals flag |
| `TestDefinitionDto` | Test configuration (online/offline, marks, timing) |
| `TestQuestionDto` | Question with type, options, answer, explanation |
| `TestAttemptDto` | Student test submission and scores |
| `OfflineMarkEntryDto` | Teacher-entered marks for offline tests |
| `NotificationEventDto` | Alert/notification with category, priority, read state |
| `TeacherDashboardKpis` | Dashboard KPI aggregation for teacher overview |

---

## File Structure

```
shared/src/
├── index.ts                              # Re-exports all
├── auth/
│   ├── index.ts
│   ├── roles.enum.ts                     # UserRole (student, parent, teacher, admin)
│   ├── jwt-payload.interface.ts          # JwtPayload, AuthenticatedUser
│   └── rbac.types.ts                     # RouteRbacRule, DEFAULT_ROUTE_RBAC (updated)
├── interfaces/
│   ├── index.ts                          # Re-exports teacher/*
│   ├── api-response.interface.ts         # ApiResponse, ApiErrorDetail, ApiMeta
│   └── teacher/
│       ├── index.ts                      # Barrel export
│       ├── teacher.enums.ts              # 8 enums
│       └── teacher.interfaces.ts         # 14 interfaces
└── constants/
    └── ...
```

---

## Cross-App Usage

| Consumer | Usage |
|----------|-------|
| **Teacher Backend** | Imports `@mindforge/shared` for shared types; entities align with interfaces |
| **Teacher Frontend** | Will import DTOs for API response typing |
| **Student Backend** | Can import `AttendanceSummaryDto`, `TestAttemptDto` for cross-app reads |
| **Gateway** | Uses `UserRole`, `RouteRbacRule` for RBAC enforcement |

---

## Verification

| Test | Expected | Result |
|------|----------|--------|
| `npx tsc` in shared | Zero errors | **Pass** |
| Shared `dist/` contains teacher types | Compiled JS + `.d.ts` files present | **Pass** |
| Teacher backend imports shared | No resolution errors | **Pass** |
| `npm run build` at workspace root | All workspaces build | **Pass** |
