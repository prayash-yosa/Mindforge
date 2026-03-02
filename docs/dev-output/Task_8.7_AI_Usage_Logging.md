# Task 8.7 — AI Usage Logging

**Sprint**: 8 — Teacher-Grounded AI Integration  
**Status**: Done  
**Date**: 2026-02-20

## Overview

Logs all AI usage for the doubt pipeline. AiUsageLogEntity captures student_id, feature_type, model, tokens (prompt+completion+total), latency_ms, retrieval stats, response_status (accepted/rejected/fallback), and rejection_reason. AiUsageRepository supports aggregation queries (per student, rejection rate). AiUsageLoggerService provides a non-blocking wrapper. All doubt pipeline AI calls log usage.

## Implementation

### AiUsageLogEntity

| Field | Type | Purpose |
|-------|------|---------|
| student_id | string | Student identifier |
| feature_type | string | e.g. doubt |
| model | string | Model used |
| tokens_prompt | number | Input tokens |
| tokens_completion | number | Output tokens |
| tokens_total | number | Total tokens |
| latency_ms | number | API latency |
| retrieval_chunk_count | number | Chunks retrieved |
| response_status | enum | accepted / rejected / fallback |
| rejection_reason | string? | If rejected |

### AiUsageRepository

- Persist usage records
- Aggregation queries: per-student usage, rejection rate over time

### AiUsageLoggerService

- **Non-blocking**: Logging does not block the request path
- Wraps AI calls; captures timing, tokens, retrieval stats
- Records response_status based on validation outcome

### Integration

- All doubt pipeline AI calls (RetrievalService embedding, AiOrchestrator LLM) log via AiUsageLoggerService
- Response status set from ResponseValidator result (accepted/rejected) or fallback when "Not found in provided material." returned

## Files Created/Modified

- `backend/src/database/entities/ai-usage-log.entity.ts` — AiUsageLogEntity
- `backend/src/database/repositories/ai-usage.repository.ts` — AiUsageRepository
- `backend/src/modules/activities/ai-usage-logger.service.ts` — AiUsageLoggerService
- `backend/src/modules/activities/doubt.service.ts` — Integrates logger into doubt flow

## Architecture

Supports cost tracking, quality monitoring (rejection rate), and compliance. Per Architecture §5.1: ai_usage_logs table. Data used for analytics and alerting on high rejection rates.

## Testing

1. Submit doubt; verify ai_usage_logs row created with correct student_id, tokens, latency
2. Trigger validation rejection; verify response_status=rejected, rejection_reason populated
3. Trigger "Not found in provided material." (empty retrieval); verify response_status=fallback
4. Run aggregation query; verify per-student and rejection-rate metrics
