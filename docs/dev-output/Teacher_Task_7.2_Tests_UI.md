# Task 7.2 — Tests UI

**Sprint**: 7 — Teacher Frontend: Content & Assessments  
**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Frontend  
**App**: Teacher  
**Status**: Done  
**Start Date**: 2026-03-02  
**Completed Date**: 2026-03-02  
**Estimate**: 3 SP

---

## Summary

Dual-tab interface (Online Quiz / Offline Test) with create forms, AI generation (with "no numericals" option for online quizzes), PDF download for offline tests, and full test lifecycle management. Teachers can author, schedule, and manage both online and offline assessments.

---

## Acceptance Criteria — Checklist

| # | Criterion | Status | Implementation |
|---|-----------|--------|----------------|
| 1 | Online tab: create form, AI generation with "no numericals" option, quiz management | **Done** | `screens/TestsScreen` with Online Quiz tab; AI generate flow |
| 2 | Offline tab: create form, PDF download, offline test management | **Done** | Offline Test tab; PDF generation and download |
| 3 | Test lifecycle: list, edit, publish, archive | **Done** | Test list with status; actions per test type |

---

## Key Details

- **Online Quiz**: Form fields for class, subject, lesson, question count; AI generation with "exclude numericals" checkbox; question bank preview; publish to students
- **Offline Test**: Form for class, subject, date, duration; AI generates PDF; download button; print-ready layout
- **Test list**: Filterable by type (Online/Offline), status (Draft/Published/Archived)
- **Lifecycle**: Draft → Published (online) or Printed (offline); Archive for completed tests

---

## Verification

| Test | Expected | Result |
|------|----------|--------|
| TypeScript check | Zero errors | **Pass** |
| Vite build | Success (54 modules, ~88KB gzipped) | **Pass** |
| All routes mapped | Tests at `/tests` | **Pass** |
