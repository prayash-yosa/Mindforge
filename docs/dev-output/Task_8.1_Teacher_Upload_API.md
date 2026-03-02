# Task 8.1 — Teacher Upload API

**Sprint**: 8 — Teacher-Grounded AI Integration  
**Status**: Done  
**Date**: 2026-02-20

## Overview

Implements the teacher material upload API with file validation, local/S3 storage, and audit logging. Teachers upload PDF, DOCX, or TXT files via multipart/form-data. The API supports listing materials and retrying failed uploads.

## Implementation

### Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/v1/teacher/materials/upload` | Upload new material (multipart/form-data) |
| GET | `/v1/teacher/materials` | List materials for teacher |
| POST | `/v1/teacher/materials/:id/retry` | Retry processing for failed material |

### File Validation

- **Allowed types**: PDF, DOCX, TXT (MIME type + extension whitelist)
- **Size limit**: 20MB max
- **Validation**: Both MIME type and file extension checked; reject if either mismatches

### Storage

- **Development**: Local filesystem at `TEACHER_STORAGE_PATH` env var
- **Production**: S3 or GCS (documented path for future implementation)

### Authentication

- **X-Teacher-Id** header required for all teacher endpoints
- Teacher auth is external; header provides identity for access control and audit

### Audit Logging

- Upload events logged (teacher_id, material_id, file_name, timestamp)
- Retry events logged (teacher_id, material_id, timestamp)

### Middleware

- **JsonOnlyMiddleware** updated to allow `multipart/form-data` for upload endpoint; other routes remain JSON-only

## Files Created/Modified

- `backend/src/modules/activities/teacher-content.controller.ts` — HTTP layer for upload, list, retry
- `backend/src/modules/activities/teacher-content.service.ts` — Business logic for upload flow
- `backend/src/modules/activities/dto/teacher-upload.dto.ts` — DTOs for upload (class, subject, file)
- `backend/src/database/entities/teacher-material.entity.ts` — TeacherMaterialEntity
- `backend/src/database/repositories/teacher-content.repository.ts` — TeacherContentRepository
- `backend/src/common/middleware/json-only.middleware.ts` — Allow multipart/form-data for upload routes

## Architecture

Sits in the API and business layers. TeacherContentController receives multipart requests, validates via DTOs, delegates to TeacherContentService. Service persists metadata via TeacherContentRepository and stores file to configured storage backend. Integrates with downstream PDF parsing (Task 8.2) via async processing pipeline.

## Testing

```bash
# Upload material (requires X-Teacher-Id header)
curl -X POST http://localhost:3000/v1/teacher/materials/upload \
  -H "X-Teacher-Id: teacher-123" \
  -F "file=@sample.pdf" \
  -F "class=8" \
  -F "subject=Science"

# List materials
curl http://localhost:3000/v1/teacher/materials -H "X-Teacher-Id: teacher-123"

# Retry failed material
curl -X POST http://localhost:3000/v1/teacher/materials/MATERIAL_UUID/retry \
  -H "X-Teacher-Id: teacher-123"
```
