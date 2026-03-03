# Task 8.2 — AI Governance

**Sprint**: 8 — Teacher Backend: Observability & Integration  
**Labels**: Type: Feature | AI: AI | Risk: Medium | Area: Teacher Backend  
**App**: Teacher  
**Status**: Done  
**Estimate**: 3 SP

---

## Summary

AI governance & guardrails for the teacher domain. AiAuditService logs all AI calls without PII. AiRateLimiterService enforces per-teacher (20/hour) and global (200/hour) rate limits. NumericalValidatorService validates online quiz questions against 14 numerical patterns. All AI services (ingestion, quiz generation, offline test generation) integrate audit logging and rate limits.

---

## What Was Implemented

- **AiAuditService** (`shared/ai-governance/ai-audit.service.ts`) — logs all AI calls without PII, tracks operation type, model, token estimates, latency, success/failure
- **AiRateLimiterService** (`shared/ai-governance/ai-rate-limiter.service.ts`) — per-teacher rate limiting (20/hour) and global limit (200/hour) for AI operations
- **NumericalValidatorService** (`shared/ai-governance/numerical-validator.service.ts`) — validates online quiz questions against 14 numerical patterns, filters violations
- **AiGovernanceModule** — `@Global()` module exposing all governance services
- **Integration into AI services**:
  - `ai-ingestion.service.ts` — rate limit checks + audit logging before/after AI calls
  - `quiz-generation.service.ts` — rate limits + enhanced numerical validation + audit logging
  - `offline-test-generation.service.ts` — rate limits + audit logging

---

## Files Created/Modified

| File | Action |
|------|--------|
| `apps/teacher/backend/src/shared/ai-governance/ai-governance.module.ts` | NEW |
| `apps/teacher/backend/src/shared/ai-governance/ai-audit.service.ts` | NEW |
| `apps/teacher/backend/src/shared/ai-governance/ai-rate-limiter.service.ts` | NEW |
| `apps/teacher/backend/src/shared/ai-governance/numerical-validator.service.ts` | NEW |
| `apps/teacher/backend/src/app.module.ts` | MODIFIED |
| `apps/teacher/backend/src/modules/syllabus/ai-ingestion.service.ts` | MODIFIED |
| `apps/teacher/backend/src/modules/tests/quiz-generation.service.ts` | MODIFIED |
| `apps/teacher/backend/src/modules/tests/offline-test-generation.service.ts` | MODIFIED |

---

## Acceptance Criteria — Checklist

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Implement AI call logging (without PII) for Teacher AI endpoints | **Done** |
| 2 | Implement per-teacher and global rate limits for AI-intensive operations | **Done** |
| 3 | Add validation to ensure prompts respect "no numericals" for online quizzes and syllabus alignment | **Done** |
