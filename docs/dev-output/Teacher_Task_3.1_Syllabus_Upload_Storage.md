# Task 3.1 — Syllabus Upload API & Storage

**Sprint**: 3 — Syllabus & AI Ingestion  
**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Backend — Syllabus  
**App**: Teacher  
**Status**: Done  
**Start Date**: 2026-03-02  
**Completed Date**: 2026-03-02  
**Estimate**: 2 SP

---

## Summary

Implemented multipart file upload API for syllabus documents (PDF/Image/Text). Files are validated for type, MIME, and size (max 20 MB), stored to local filesystem under a per-class directory, and a `syllabus_document` record is created with status `pending` for downstream AI processing. Retry-failed-document support is also included.

---

## Acceptance Criteria — Checklist

| # | Criterion | Status | Implementation |
|---|-----------|--------|----------------|
| 1 | Upload API stores files and creates `syllabus_document` with `PENDING` status | **Done** | `POST /v1/syllabus/upload` with multipart `file` + JSON metadata |
| 2 | Metadata stored: class, subject, date, duration (1 hour default) | **Done** | `UploadSyllabusDto` validates classId, subject, optional classDate & durationMinutes |
| 3 | File size and type limits enforced; clear errors on failure | **Done** | Max 20 MB; allowed: .pdf, .jpg, .jpeg, .png, .webp, .txt; custom error codes |

---

## API Contract

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/v1/syllabus/upload` | Upload syllabus file (multipart/form-data) |
| POST | `/v1/syllabus/:docId/retry` | Retry processing for a failed document |

---

## DTOs

| DTO | Fields | Validation |
|-----|--------|------------|
| `UploadSyllabusDto` | classId, subject, classDate?, durationMinutes? | classId & subject required; classDate ISO-8601; duration 15–180 min |

---

## Service Layer

`SyllabusUploadService` handles:
- Class existence validation before storing
- File validation: extension whitelist (`.pdf`, `.jpg`, `.jpeg`, `.png`, `.webp`, `.txt`), MIME whitelist, size limit from config
- File storage: local filesystem at `{storagePath}/{classId}/{timestamp}_{sanitizedName}`
- Creates `syllabus_document` entity with status `pending`
- Retry: resets `failed` documents back to `pending` for re-processing

---

## File Structure

```
modules/syllabus/
├── dto/
│   └── upload-syllabus.dto.ts      # Upload validation DTO
├── syllabus-upload.service.ts       # Upload + file storage logic
├── syllabus-read.service.ts         # Read APIs (Task 3.3)
├── ai-ingestion.service.ts          # AI processing (Task 3.2)
├── syllabus.controller.ts           # All syllabus endpoints
└── syllabus.module.ts               # Module wiring + MulterModule
```

---

## Verification

- **Build**: `npx nest build` — zero errors
- **Boot**: All syllabus routes mapped at startup
- **Route**: `POST /v1/syllabus/upload` accepts multipart with `file` field + body metadata
- **Validation**: Invalid file types, oversized files, and missing fields return descriptive error codes (`FILE_REQUIRED`, `INVALID_FILE_TYPE`, `INVALID_MIME_TYPE`, `FILE_TOO_LARGE`)
