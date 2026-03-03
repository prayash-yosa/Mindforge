# Task 6.3 — Classes & Attendance Screen

**Sprint**: 6 — Teacher Frontend: Core  
**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Frontend  
**App**: Teacher  
**Status**: Done  
**Start Date**: 2026-03-02  
**Completed Date**: 2026-03-02  
**Estimate**: 3 SP

---

## Summary

Attendance marking screen with class and session selectors, student list with P/A (Present/Absent) toggle pills (48px touch targets), summary chips (present/absent counts), sticky save footer, and default-present pattern. Supports both desktop and mobile layouts.

---

## Acceptance Criteria — Checklist

| # | Criterion | Status | Implementation |
|---|-----------|--------|----------------|
| 1 | Desktop layout: class/session dropdowns, student table with P/A pills, summary chips, sticky footer | **Done** | `screens/ClassesAttendanceScreen` with responsive layout |
| 2 | Mobile layout: stacked selectors, scrollable student list, 48px touch targets for P/A | **Done** | Mobile-first CSS; touch-friendly pill buttons |
| 3 | API wiring: fetch session students, submit attendance with absent list | **Done** | `GET /v1/attendance/session/:sessionId`; `POST /v1/attendance/mark` |

---

## Key Details

- **Default-present pattern**: All students shown as Present by default; teacher marks absentees only
- **P/A pills**: 48px minimum touch target for accessibility; Present (green) / Absent (red) states
- **Summary chips**: "12 Present • 2 Absent" above or below student list
- **Sticky save footer**: "Save Attendance" button fixed at bottom; disabled when edit window expired
- **Edit window**: Same-day only; UI disables save after `editable_until`

---

## Verification

| Test | Expected | Result |
|------|----------|--------|
| TypeScript check | Zero errors | **Pass** |
| Vite build | Success (54 modules, ~88KB gzipped) | **Pass** |
| All routes mapped | Classes at `/classes`, calendar at `/classes/calendar` | **Pass** |
