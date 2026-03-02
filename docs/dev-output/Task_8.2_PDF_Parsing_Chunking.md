# Task 8.2 — PDF Parsing & Chunking

**Sprint**: 8 — Teacher-Grounded AI Integration  
**Status**: Done  
**Date**: 2026-02-20

## Overview

Extracts text from uploaded PDFs using pdf-parse v1, cleans the text (headers, footers, page numbers, whitespace), and splits it into semantic chunks (~500 tokens with ~50 token overlap). Chunks are stored in TeacherMaterialChunkEntity. Processing is async and non-blocking; on parse failure the material status is set to `failed`.

## Implementation

### PDF Extraction

- **Library**: pdf-parse v1
- **Output**: Raw text from all pages concatenated

### Text Cleaning

- Remove headers and footers (common patterns)
- Remove page numbers
- Normalize whitespace (collapse multiple spaces, trim)

### Semantic Chunking

- **Target size**: ~500 tokens per chunk
- **Overlap**: ~50 tokens between adjacent chunks
- **Boundary preservation**: Prefer paragraph boundaries; avoid splitting mid-sentence

### Entity

- **TeacherMaterialChunkEntity**: id, material_id (FK), chunk_text, chunk_index, syllabus_ref (class, subject, chapter, topic), created_at

### Processing Flow

- **Async**: Upload returns immediately; processing runs in background (in-process worker)
- **On success**: Chunks persisted; material status → `ready`
- **On parse failure**: Material status → `failed`; no chunks created

## Files Created/Modified

- `backend/src/database/entities/teacher-material-chunk.entity.ts` — TeacherMaterialChunkEntity
- `backend/src/modules/activities/teacher-content.service.ts` — PDF parsing, cleaning, chunking logic
- `backend/src/database/repositories/teacher-content.repository.ts` — Chunk persistence

## Architecture

Part of the teacher content ingestion pipeline. Runs after file storage (Task 8.1). Produces chunks that EmbeddingService (Task 8.3) consumes. Chunks are the unit of retrieval for the doubt pipeline.

## Testing

1. Upload a valid PDF via Task 8.1 endpoint
2. Poll `GET /v1/teacher/materials` until status is `ready` or `failed`
3. Verify chunks exist in DB for `ready` materials
4. Upload a corrupted or non-PDF file; verify status becomes `failed`
