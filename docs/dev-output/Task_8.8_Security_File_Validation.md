# Task 8.8 — Security & File Validation

**Sprint**: 8 — Teacher-Grounded AI Integration  
**Status**: Done  
**Date**: 2026-02-20

## Overview

Consolidates security controls for the teacher-grounded AI pipeline: file validation (MIME + extension whitelist, 20MB limit), X-Teacher-Id header for teacher access control, student retrieval scoped by class at repository level, no raw teacher material exposed to students, audit logging for upload/retry, rate limiting via ThrottlerGuard, and multipart/form-data allowed in JsonOnlyMiddleware.

## Implementation

### File Validation

- **MIME type whitelist**: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain
- **Extension whitelist**: .pdf, .docx, .txt
- **Size limit**: 20MB max
- **Dual check**: Both MIME and extension must match; reject if either fails

### Access Control

- **X-Teacher-Id header**: Required for teacher endpoints; identity used for upload ownership and audit
- **Student retrieval**: Scoped by class at repository level; students only access chunks from materials for their class
- **No raw material**: Students never receive raw teacher files; only chunk text via AI response

### Audit Logging

- Upload events: teacher_id, material_id, file_name, timestamp
- Retry events: teacher_id, material_id, timestamp

### Rate Limiting

- **ThrottlerGuard**: Global rate limiting applied
- Protects against abuse of upload and API endpoints

### Middleware

- **JsonOnlyMiddleware**: Allows multipart/form-data for upload routes; other routes remain JSON-only

## Files Created/Modified

- `backend/src/modules/activities/teacher-content.controller.ts` — File validation, X-Teacher-Id guard
- `backend/src/modules/activities/dto/teacher-upload.dto.ts` — File validation constraints
- `backend/src/database/repositories/embeddings.repository.ts` — Class-scoped retrieval
- `backend/src/common/middleware/json-only.middleware.ts` — Multipart exception
- `backend/src/main.ts` or app config — ThrottlerGuard registration

## Architecture

Implements security-by-design per Architecture §2 (Security-by-Design mode). Teacher material is intellectual property; access control enforced per class. File validation prevents malicious uploads. Audit log supports compliance.

## Testing

1. Upload with invalid MIME (e.g. rename .exe to .pdf) → reject
2. Upload with invalid extension → reject
3. Upload &gt; 20MB → reject
4. Request without X-Teacher-Id → 401/403
5. Student doubt: verify retrieval only returns chunks from student's class
6. Verify audit log entries for upload and retry
