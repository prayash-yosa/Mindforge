# Task 8.9 — DevOps & Config

**Sprint**: 8 — Teacher-Grounded AI Integration  
**Status**: Done  
**Date**: 2026-02-20

## Overview

Documents environment variables, async processing setup, build verification, entity migrations, CORS configuration, and production deployment path. Ensures NestJS build succeeds with zero errors, new entities auto-migrate in dev (TypeORM synchronize:true), and production path (S3/GCS, pgvector, queue-based worker, secrets vault) is documented.

## Implementation

### Environment Variables

| Variable | Purpose |
|----------|---------|
| TEACHER_STORAGE_PATH | Local filesystem path for dev; where uploaded files are stored |
| EMBEDDING_MODEL | OpenAI model for embeddings (default: text-embedding-3-small) |
| RETRIEVAL_CONFIDENCE_THRESHOLD | Min similarity score (default: 0.7) |
| RETRIEVAL_TOP_K | Max chunks to return (default: 5) |

### Async Processing

- **In-process worker**: Content processing (parse, chunk, embed) runs asynchronously after upload
- Upload returns immediately; processing continues in background
- No external queue in dev; single-process in-process async

### Build & Migrations

- **NestJS build**: `npm run build` succeeds with zero errors
- **Dev migrations**: TypeORM `synchronize: true` in dev; new entities (TeacherMaterial, TeacherMaterialChunk, AiUsageLog) auto-create tables

### CORS

- CORS configuration updated to allow `X-Teacher-Id` header for teacher upload client

### Production Path (Documented)

| Component | Dev | Production |
|-----------|-----|------------|
| Storage | Local filesystem (TEACHER_STORAGE_PATH) | S3 or GCS |
| Embeddings | JSON text in SQLite | pgvector in PostgreSQL |
| Processing | In-process async worker | Queue-based embedding worker |
| Secrets | .env file | Secrets vault (e.g. AWS Secrets Manager, Vault) |

## Files Created/Modified

- `backend/.env.example` — Document new env vars
- `backend/src/main.ts` — CORS config for X-Teacher-Id
- `backend/src/database/database.module.ts` — Entity registration
- `backend/package.json` — Dependencies (pdf-parse, etc.)
- Documentation (this file) — Production path

## Architecture

Aligns with Architecture §4 (Technology Stack): single-region, containers, managed DB, secrets vault, cloud object storage. Dev setup enables rapid iteration; production path documented for deployment.

## Testing

1. Set TEACHER_STORAGE_PATH; verify uploads land in correct directory
2. Set EMBEDDING_MODEL; verify correct model used
3. Set RETRIEVAL_* vars; verify retrieval behavior
4. Run `npm run build` in backend; verify zero errors
5. Start backend in dev; verify new tables created (teacher_materials, teacher_material_chunks, ai_usage_logs)
6. Verify CORS allows X-Teacher-Id from expected origins
