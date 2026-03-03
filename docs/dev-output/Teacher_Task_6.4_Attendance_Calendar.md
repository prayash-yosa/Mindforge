# Task 6.4 — Attendance Calendar

**Sprint**: 6 — Teacher Frontend: Core  
**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Frontend  
**App**: Teacher  
**Status**: Done  
**Start Date**: 2026-03-02  
**Completed Date**: 2026-03-02  
**Estimate**: 1 SP

---

## Summary

Monthly calendar grid with present/absent dots per day, summary stats (e.g. attendance % for month), and student-wise breakdown table. Provides visual overview of attendance patterns across the month.

---

## Acceptance Criteria — Checklist

| # | Criterion | Status | Implementation |
|---|-----------|--------|----------------|
| 1 | Calendar views: monthly grid with present/absent dots; student breakdown table | **Done** | `screens/AttendanceCalendarScreen` with calendar component |
| 2 | Aggregates with error states | **Done** | Fetches attendance summary; loading/error/empty states handled |

---

## Key Details

- **Calendar grid**: Standard month view; each day shows dot indicators (e.g. green = all present, red = any absent, gray = no data)
- **Summary stats**: Monthly attendance percentage; total sessions; present/absent counts
- **Student breakdown**: Table listing each student with their attendance count for the selected period
- **Filters**: Class selector; date range or month picker

---

## Verification

| Test | Expected | Result |
|------|----------|--------|
| TypeScript check | Zero errors | **Pass** |
| Vite build | Success (54 modules, ~88KB gzipped) | **Pass** |
| All routes mapped | Calendar at `/classes/calendar` | **Pass** |
