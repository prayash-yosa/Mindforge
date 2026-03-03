# Task 1.2 — Teacher Backend Skeleton (NestJS Service)

**Sprint**: 1 — Workspace Integration & Teacher Service Foundation  
**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Backend  
**App**: Teacher  
**Status**: Done  
**Start Date**: 2026-03-02  
**Completed Date**: 2026-03-02  
**Estimate**: 2 SP

---

## Summary

Created the full Teacher NestJS backend service skeleton with production-ready infrastructure: module layout matching architecture, health/version endpoint, database connection (SQLite dev / PostgreSQL prod), global validation pipe, exception filter, auth guard, RBAC guard, rate limiting, CORS, Helmet, Swagger, audit logging, and development seeder.

---

## Acceptance Criteria — Checklist

| # | Criterion | Status | Implementation |
|---|-----------|--------|----------------|
| 1 | NestJS app with module layout matching architecture | **Done** | 7 modules: Health, ClassAttendance, Syllabus, Tests, Evaluation, Analytics, Notifications |
| 2 | Basic health check and version endpoint | **Done** | `GET /v1/health` → `{ status, service, version, timestamp }` |
| 3 | Connection to Teacher DB (PostgreSQL/SQLite per workspace pattern) | **Done** | `DatabaseModule` with TypeORM: SQLite in-memory for dev, PostgreSQL for prod |
| 4 | No direct imports from other app backends; only `@mindforge/shared` | **Done** | Package depends only on `@mindforge/shared` for cross-app types |

---

## Stack

| Area | Choice |
|------|--------|
| **Runtime** | Node.js ≥18 |
| **Framework** | NestJS 10 (TypeScript) |
| **Validation** | class-validator + class-transformer (global ValidationPipe) |
| **API Docs** | @nestjs/swagger (OpenAPI at `/api/docs`) |
| **Rate Limiting** | @nestjs/throttler (global) |
| **Security** | Helmet 8 (security headers) |
| **Auth** | @nestjs/jwt (Bearer token validation) |
| **Data** | TypeORM + better-sqlite3 (dev) / PostgreSQL (prod) |

---

## Code Structure

```
apps/teacher/backend/src/
├── main.ts                              # Bootstrap (Helmet, CORS, Swagger, ValidationPipe)
├── app.module.ts                        # Root module (all imports, guards, filters, interceptors)
├── config/
│   ├── config.module.ts                 # NestJS ConfigModule (global)
│   └── configuration.ts                 # Typed config factory (port, JWT, AI, DB, storage)
├── common/
│   ├── decorators/
│   │   ├── public.decorator.ts          # @Public() — bypass auth
│   │   ├── teacher.decorator.ts         # @Teacher() param decorator
│   │   └── roles.decorator.ts           # @Roles('teacher', 'admin')
│   ├── dto/
│   │   └── error-response.dto.ts        # Standard error shape
│   ├── exceptions/
│   │   └── domain.exceptions.ts         # Typed domain exceptions
│   ├── filters/
│   │   └── http-exception.filter.ts     # GlobalExceptionFilter → {code,message,details?}
│   ├── guards/
│   │   ├── auth.guard.ts                # JWT Bearer + @Public() bypass
│   │   └── roles.guard.ts              # RBAC via @Roles()
│   ├── interceptors/
│   │   ├── request-id.interceptor.ts    # X-Request-Id UUID
│   │   └── logging.interceptor.ts       # HTTP request logging
│   └── middleware/
│       ├── https-enforce.middleware.ts   # HTTPS redirect (behind LB)
│       └── json-only.middleware.ts       # 415 for non-JSON (allows multipart)
├── database/                            # Task 1.3
├── modules/
│   ├── health/                          # Health check
│   ├── class-attendance/                # Shell (Sprint 2)
│   ├── syllabus/                        # Shell (Sprint 3)
│   ├── tests/                           # Shell (Sprint 4)
│   ├── evaluation/                      # Shell (Sprint 4)
│   ├── analytics/                       # Shell (Sprint 5)
│   └── notifications/                   # Shell (Sprint 5)
└── shared/
    └── audit/
        ├── audit.module.ts              # Global
        └── audit.service.ts             # Structured audit logging
```

---

## Security Baseline

| Feature | Implementation |
|---------|----------------|
| Auth Guard | JWT Bearer validation (global, `@Public()` bypass) |
| Roles Guard | RBAC via `@Roles()` decorator |
| Rate Limiting | ThrottlerGuard (global, configurable TTL + limit) |
| Audit Logging | AuditService (global, structured, no PII) |
| Error Shape | `{ code, message, details? }` for all 400–500 |
| CORS | Configurable origins (gateway + frontend) |
| Helmet | Security headers on all responses |

---

## API Contract

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/v1/health` | Health check + version | Public |
| GET | `/api/docs` | OpenAPI Swagger UI (dev only) | Public |

---

## Domain Exceptions

| Exception | HTTP Status | Code |
|-----------|-------------|------|
| `EntityNotFoundException` | 404 | `NOT_FOUND` |
| `EditWindowExpiredException` | 403 | `EDIT_WINDOW_EXPIRED` |
| `DuplicateEntryException` | 409 | `DUPLICATE_ENTRY` |
| `InvalidOperationException` | 422 | `INVALID_OPERATION` |

---

## Verification

| Test | Expected | Result |
|------|----------|--------|
| `nest build` | Zero TypeScript errors | **Pass** |
| Service boots on port 3003 | All modules initialize | **Pass** |
| `GET /v1/health` | `{ status: "ok", service: "teacher-backend", version: "1.0.0" }` | **Pass** |
| Swagger UI at `/api/docs` | HTTP 200 | **Pass** |
| Dev seeder runs | Teacher, classes, students created | **Pass** |

---

## Notes for Next Tasks

- Task 1.3 fills in the `database/` directory with 12 entity definitions and 6 repositories.
- Task 1.4 creates shared contracts in `@mindforge/shared` for cross-app consumption.
- Sprint 2 (Tasks 2.1–2.3) will populate the module shells with controllers, services, and business logic.
