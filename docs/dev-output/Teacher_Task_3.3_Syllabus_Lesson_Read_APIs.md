# Task 3.3 — Syllabus & Lesson Read APIs for Frontend

**Sprint**: 3 — Syllabus & AI Ingestion  
**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Backend — Syllabus  
**App**: Teacher  
**Status**: Done  
**Start Date**: 2026-03-02  
**Completed Date**: 2026-03-02  
**Estimate**: 3 SP

---

## Summary

Implemented read APIs for listing syllabus uploads with processing status, retrieving extracted lesson details (concept summaries, learning objectives, chapters, topics, `has_numericals` flags), and individual document/lesson lookups. Error states (failed processing) are clearly surfaced with `errorMessage` fields for the frontend UX.

---

## Acceptance Criteria — Checklist

| # | Criterion | Status | Implementation |
|---|-----------|--------|----------------|
| 1 | List syllabus uploads with status (Processing, Ready, Failed) | **Done** | `GET /v1/syllabus/class/:classId` returns all docs with status |
| 2 | Get chapters/topics and lesson details (summary, objectives, flags) | **Done** | `GET /v1/syllabus/lessons/class/:classId` with optional `?subject=` filter |
| 3 | Failed processing states clearly surfaced for UX | **Done** | `errorMessage` field on document list items; status = `failed` |

---

## API Contract

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1/syllabus/class/:classId` | List all syllabus uploads for a class (with status) |
| GET | `/v1/syllabus/:docId` | Get single document details |
| GET | `/v1/syllabus/:docId/lesson` | Get lesson extracted from a specific document |
| GET | `/v1/syllabus/lessons/class/:classId` | List all lessons for a class (optional `?subject=`) |
| GET | `/v1/syllabus/lessons/:lessonId` | Get single lesson details |

---

## Response Shapes

### SyllabusListItem
| Field | Type | Notes |
|-------|------|-------|
| id | string (UUID) | Document ID |
| classId | string | Parent class |
| subject | string | Subject name |
| fileName | string | Original file name |
| fileType | string | MIME type |
| fileSizeBytes | number | File size |
| status | string | `pending` / `processing` / `ready` / `failed` |
| errorMessage | string? | Present when status = `failed` |
| classDate | string? | ISO date for the lesson |
| durationMinutes | number | Default 60 |
| uploadedAt | Date | Upload timestamp |

### LessonDetail
| Field | Type | Notes |
|-------|------|-------|
| id | string (UUID) | Lesson ID |
| syllabusDocumentId | string | Source document |
| classId | string | Parent class |
| subject | string | Subject |
| conceptSummary | string | AI-generated summary |
| learningObjectives | string[] | Parsed from JSON |
| hasNumericals | boolean | Numerical content flag |
| chapters | string[] | Parsed from JSON |
| topics | string[] | Parsed from JSON |
| createdAt | Date | Created timestamp |

---

## Service Layer

`SyllabusReadService` provides:
- `listByClass(classId)` → ordered by `uploadedAt DESC`
- `getDocumentById(docId)` → throws `EntityNotFoundException` if missing
- `getLessonsByClass(classId, subject?)` → optional subject filter
- `getLessonById(lessonId)` → throws `EntityNotFoundException` if missing
- `getLessonByDocument(documentId)` → returns null if not yet processed
- JSON array fields (`learningObjectives`, `chapters`, `topics`) safely parsed with fallback

---

## Verification

- **Build**: `npx nest build` — zero errors
- **Boot**: All 5 read routes mapped at startup
- **Response format**: Consistent `{ success: true, data: ... }` wrapper
- **Error states**: Missing entities return 404; failed docs include `errorMessage`
