# Task 5.3 — Cross-App Read APIs for Student/Parent/Admin

**Sprint**: 5 — Analytics & Notifications  
**Labels**: Type: Feature | AI: Non-AI | Risk: Medium | Area: Teacher Backend — Integration  
**App**: Teacher  
**Status**: Done  
**Start Date**: 2026-03-02  
**Completed Date**: 2026-03-02  
**Estimate**: 2 SP

---

## Summary

Implemented read-only cross-app endpoints consumed by Student/Parent/Admin apps via the API gateway. Provides attendance summaries (class-level and student-specific), class performance KPIs with score trends, and individual student test results (online attempts + offline marks). RBAC enforced at the gateway layer per shared contracts.

---

## Acceptance Criteria — Checklist

| # | Criterion | Status | Implementation |
|---|-----------|--------|----------------|
| 1 | Read-only endpoints for attendance and performance aggregates | **Done** | CrossAppController with 4 endpoints for attendance + performance |
| 2 | Uses @mindforge/shared contracts; RBAC at gateway | **Done** | Existing shared interfaces; gateway RBAC rules apply to /api/teacher |

---

## API Contract

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1/cross-app/attendance/summary/:classId` | Attendance summary for a class |
| GET | `/v1/cross-app/attendance/student/:studentId/class/:classId` | Individual student attendance |
| GET | `/v1/cross-app/performance/:classId` | Class performance KPIs + score trends |
| GET | `/v1/cross-app/performance/student/:studentId/test/:testId` | Student's test result (online + offline) |

---

## Cross-App Consumers

| Consumer | Endpoints Used | Scope |
|----------|---------------|-------|
| Student App | attendance/student, performance/student | Own data only |
| Parent App | attendance/student, performance/student | Child's data |
| Admin App | attendance/summary, performance | Full class data |

---

## Verification

- **Build**: `npx nest build` — zero errors
- **Boot**: All 4 cross-app routes mapped
- **RBAC**: Gateway enforces role-based access to /api/teacher endpoints
- **Data**: No direct DB sharing; all access via these REST APIs
