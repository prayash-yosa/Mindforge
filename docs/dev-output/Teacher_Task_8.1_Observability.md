# Task 8.1 — Observability

**Sprint**: 8 — Teacher Backend: Observability & Integration  
**Labels**: Type: Infrastructure | AI: Non-AI | Risk: Low | Area: Teacher Backend  
**App**: Teacher  
**Status**: Done  
**Estimate**: 2 SP

---

## Summary

Teacher service observability: logs, metrics, tracing. MetricsService tracks request count, error count, AI call count, latency, p95/p99 percentiles, memory usage. Health endpoints for liveness, readiness, and full metrics snapshot. LoggingInterceptor records metrics on every request; startup diagnostics log environment, port, CORS, DB type, AI provider status.

---

## What Was Implemented

- **MetricsService** (`modules/health/metrics.service.ts`) — tracks request count, error count, AI call count, latency, p95/p99 percentiles, memory usage
- **Health Controller enhancements**:
  - `GET /v1/health/live` — Liveness probe
  - `GET /v1/health/ready` — Readiness probe with database connectivity check
  - `GET /v1/health/metrics` — Full metrics snapshot (uptime, request stats, latency, AI metrics, memory)
- **HealthModule** marked `@Global()` to expose MetricsService app-wide
- **LoggingInterceptor** enhanced — records metrics on every request (success and error paths), structured JSON logging in production
- **Startup diagnostics** in `main.ts` — logs environment, port, CORS, DB type, AI provider status, throttle config

---

## Files Created/Modified

| File | Action |
|------|--------|
| `apps/teacher/backend/src/modules/health/metrics.service.ts` | NEW |
| `apps/teacher/backend/src/modules/health/health.controller.ts` | MODIFIED |
| `apps/teacher/backend/src/modules/health/health.module.ts` | MODIFIED |
| `apps/teacher/backend/src/common/interceptors/logging.interceptor.ts` | MODIFIED |
| `apps/teacher/backend/src/main.ts` | MODIFIED |

---

## Acceptance Criteria — Checklist

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Integrate Teacher backend with platform logging/monitoring stack (structured logs, metrics endpoints) | **Done** |
| 2 | Add health checks and readiness probes for Teacher backend and gateway routes | **Done** |
