# Task 2.1 — Class & Timetable Domain (Class, Sessions, Mappings)

**Sprint**: 2 — Class & Attendance Backend  
**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Backend — Class & Attendance  
**App**: Teacher  
**Status**: Done  
**Start Date**: 2026-03-02  
**Completed Date**: 2026-03-02  
**Estimate**: 2 SP

---

## Summary

Implemented full CRUD APIs for classes, class sessions (1-hour timetable slots), and student-class mappings. Teachers can create classes, open sessions for attendance, and manage student enrollment. All sessions include an `editable_until` (end of day) for same-day edit enforcement.

---

## Acceptance Criteria — Checklist

| # | Criterion | Status | Implementation |
|---|-----------|--------|----------------|
| 1 | CRUD APIs for class, class_session, class_student | **Done** | ClassController with 9 endpoints |
| 2 | Sessions aligned with 1-hour slots; include teacher, subject, datetime | **Done** | CreateSessionDto validates; default 60 min; editable_until auto-set |
| 3 | Read APIs for Student/Parent/Admin via gateway | **Done** | GET endpoints are role-agnostic; gateway RBAC scopes access |

---

## API Contract

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/v1/classes` | Create a new class |
| GET | `/v1/classes` | List teacher's classes |
| GET | `/v1/classes/:id` | Get class by ID |
| POST | `/v1/classes/sessions` | Create a class session |
| GET | `/v1/classes/sessions/:id` | Get session by ID |
| GET | `/v1/classes/:classId/sessions` | List sessions for a class (with optional date range) |
| POST | `/v1/classes/students` | Add student to class |
| GET | `/v1/classes/:classId/students` | List students in class |
| DELETE | `/v1/classes/:classId/students/:studentId` | Remove student from class (soft delete) |

---

## DTOs

| DTO | Fields | Validation |
|-----|--------|------------|
| `CreateClassDto` | grade, section, subject, academicYear | All required, string, max lengths |
| `CreateSessionDto` | classId, subject, scheduledAt, durationMinutes? | classId required; scheduledAt ISO date; duration 15-180 min |
| `AddStudentDto` | classId, studentId, studentName, rollNumber? | All required except rollNumber |

---

## Service Layer

`ClassService` handles all business logic:
- Class existence validation before creating sessions or adding students
- Auto-calculates `editable_until` as end-of-day for each session
- Delegates to `ClassRepository` for all DB operations
- No DB logic in controller; strict separation

---

## Verification

| Test | Expected | Result |
|------|----------|--------|
| `nest build` | Zero TypeScript errors | **Pass** |
| Routes mapped on boot | 9 ClassController routes visible | **Pass** |
| Dev seeder creates classes | 2 classes + 5 students each | **Pass** |
