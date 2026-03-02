# Task 8.4 — Retrieval Service

**Sprint**: 8 — Teacher-Grounded AI Integration  
**Status**: Done  
**Date**: 2026-02-20

## Overview

RetrievalService embeds the student question using the same embedding model as teacher chunks, then performs vector similarity search scoped by class/subject at the repository level. Returns top-K chunks above a confidence threshold. Below threshold returns empty result, triggering "Not found in provided material." downstream. 10s timeout on embedding API call.

## Implementation

### Flow

1. **Embed question**: Student question embedded via same model (text-embedding-3-small / EMBEDDING_MODEL)
2. **Vector search**: EmbeddingsRepository performs similarity search scoped by class/subject
3. **Filter by confidence**: Only chunks with similarity ≥ threshold returned
4. **Return top-K**: Up to K chunks (default 5)

### Configuration

| Env Var | Default | Purpose |
|---------|---------|---------|
| RETRIEVAL_TOP_K | 5 | Maximum chunks to return |
| RETRIEVAL_CONFIDENCE_THRESHOLD | 0.7 | Minimum similarity score |

### Scoping

- Search scoped by class and subject at repository level
- Only chunks from materials matching student's syllabus context

### Timeout

- 10 seconds timeout on embedding API call for the question
- On timeout → empty result → "Not found in provided material."

### Below-Threshold Behavior

- If best chunk similarity &lt; threshold → empty result
- Downstream (AiOrchestrator, DoubtService) returns "Not found in provided material."

## Files Created/Modified

- `backend/src/modules/activities/retrieval.service.ts` — RetrievalService
- `backend/src/database/repositories/embeddings.repository.ts` — Vector search scoped by class/subject

## Architecture

Called by DoubtService before AI orchestration. Provides the sole context for AI answers. Part of the retrieval-augmented generation pipeline per Architecture §5.3 and §7.

## Testing

1. Upload material, ensure chunks have embeddings
2. Call RetrievalService with question + syllabus context (class, subject)
3. Verify top-K chunks returned when relevant content exists
4. Verify empty result when question is off-topic or below threshold
5. Simulate embedding timeout; verify graceful fallback
