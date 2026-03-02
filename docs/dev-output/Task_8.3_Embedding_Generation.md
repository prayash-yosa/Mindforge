# Task 8.3 — Embedding Generation

**Sprint**: 8 — Teacher-Grounded AI Integration  
**Status**: Done  
**Date**: 2026-02-20

## Overview

Generates embeddings for teacher material chunks via OpenAI text-embedding-3-small (configurable via `EMBEDDING_MODEL` env var). Processes in batches of 20 chunks per API call. Stores embeddings as JSON text in SQLite for dev; production uses pgvector. On embedding failure, material status is set to `failed`.

## Implementation

### Embedding Model

- **Default**: OpenAI `text-embedding-3-small`
- **Configurable**: `EMBEDDING_MODEL` env var

### Batch Processing

- **Batch size**: 20 chunks per API call
- **Sequential batches**: Process all chunks of a material in batches to respect rate limits

### Storage

- **Development (SQLite)**: Embedding vector stored as JSON text in chunk row
- **Production (PostgreSQL)**: pgvector column for native vector operations
- **EmbeddingsRepository**: CRUD and similarity search

### Similarity Search

- **Dev mode**: Application-level cosine similarity (no pgvector)
- **Production path**: HNSW or IVFFlat index documented for pgvector

### Failure Handling

- On embedding API failure → material status → `failed`
- Partial failures (e.g. some batches succeed) → material status → `failed`; no partial persistence

## Files Created/Modified

- `backend/src/database/repositories/embeddings.repository.ts` — EmbeddingsRepository
- `backend/src/modules/activities/teacher-content.service.ts` — Embedding generation orchestration
- `backend/src/database/entities/teacher-material-chunk.entity.ts` — Embedding column (JSON or pgvector)

## Architecture

Runs after chunking (Task 8.2). Populates embedding vectors used by RetrievalService (Task 8.4) for vector similarity search. Part of the teacher content ingestion pipeline.

## Testing

1. Upload PDF and wait for processing to complete (status `ready`)
2. Verify chunks have non-null embedding data in DB
3. Simulate embedding API failure (invalid key, network error); verify material status → `failed`
