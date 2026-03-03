# Task 7.1 — Syllabus Upload UI

**Sprint**: 7 — Teacher Frontend: Content & Assessments  
**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Frontend  
**App**: Teacher  
**Status**: Done  
**Start Date**: 2026-03-02  
**Completed Date**: 2026-03-02  
**Estimate**: 2 SP

---

## Summary

Upload zone with file selection (drag-and-drop or click), form fields (class, subject, date), status badges (Pending/Processing/Ready/Failed), lesson detail view with concepts/objectives/chapters/topics, and retry action for failed documents. Integrates with syllabus upload and read APIs.

---

## Acceptance Criteria — Checklist

| # | Criterion | Status | Implementation |
|---|-----------|--------|----------------|
| 1 | Upload screen per UX: file zone, form fields, status badges, lesson detail view | **Done** | `screens/SyllabusScreen` with upload flow and document list |
| 2 | Processing states: Pending, Processing, Ready, Failed; retry for failed | **Done** | Status badges with color coding; retry button calls `POST /v1/syllabus/:docId/retry` |

---

## Key Details

- **Upload zone**: Accepts PDF, images (.jpg, .png, .webp), .txt; max 20 MB
- **Form fields**: Class (dropdown), Subject (text), Date (optional), Duration (default 1 hour)
- **Status badges**: Pending (gray), Processing (blue), Ready (green), Failed (red)
- **Lesson detail view**: Expandable row or modal showing concepts, objectives, chapters, topics from AI ingestion
- **Retry**: For Failed documents; resets to Pending for re-processing

---

## Verification

| Test | Expected | Result |
|------|----------|--------|
| TypeScript check | Zero errors | **Pass** |
| Vite build | Success (54 modules, ~88KB gzipped) | **Pass** |
| All routes mapped | Syllabus at `/syllabus` | **Pass** |
