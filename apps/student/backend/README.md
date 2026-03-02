# Mindforge Backend

Backend API service for the Mindforge Student Experience platform.  
**Stack**: Node.js + NestJS (TypeScript) — architecture enforced like Spring Boot.

## Architecture

Three-tier modular structure per Technical Architecture + locked stack decision:

```
src/
├── main.ts                          # Bootstrap (Helmet, CORS, Swagger, Validation)
├── app.module.ts                    # Root module (wires everything)
├── config/                          # Environment-driven configuration
│   ├── config.module.ts
│   └── configuration.ts
├── common/                          # Shared infrastructure
│   ├── decorators/                  # @Public(), @Roles()
│   ├── dto/                         # ErrorResponseDto
│   ├── filters/                     # GlobalExceptionFilter
│   ├── guards/                      # AuthGuard, AuthorizationGuard
│   ├── interceptors/                # RequestId, Logging
│   ├── middleware/                   # HTTPS enforce, JSON-only
│   └── pipes/                       # (Global ValidationPipe in main.ts)
├── modules/                         # Feature modules
│   ├── auth/                        # Controller → Service → Repository + Policy + DTOs
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts       # HTTP only
│   │   ├── auth.service.ts          # Business logic only
│   │   ├── auth.repository.ts       # DB only (stub)
│   │   ├── auth.policy.ts           # Authorization policies
│   │   └── dto/                     # VerifyMpin, LockoutStatus, ForgotMpin
│   ├── health/                      # Health check controller
│   ├── student/                     # Stub — Sprint 3/5
│   ├── attendance/                  # Stub — Sprint 5
│   └── activities/                  # Stub — Sprint 3/4
└── shared/                          # Global services
    ├── audit/                       # AuditService (logging)
    └── database/                    # DB config (Task 2.1)
```

### Rules (Enforced)

| Layer | Rule |
|-------|------|
| **Controllers** | HTTP only — validate, route, respond |
| **Services** | Business logic only — no HTTP, no DB |
| **Repositories** | DB only — no business logic |
| **Policies** | Authorization rules per module |
| **No cross-module DB access** | Each module owns its own repository |

## Quick Start

```bash
npm install
cp .env.example .env
npm run build
npm run start:dev     # Development with watch
npm start             # Production
```

## API (versioned: /v1)

### Health Check (no auth)
```
GET /health → 200 { status, service, timestamp, uptime }
```

### Auth (no auth required)
```
POST /v1/auth/mpin/verify       → Verify MPIN, issue token
POST /v1/auth/lockout/status    → Check lockout state
POST /v1/auth/forgot-mpin       → Initiate recovery
```

### OpenAPI Docs
```
GET /api/docs    → Swagger UI (development only)
```

### Error Response Shape
```json
{ "code": "VALIDATION_ERROR", "message": "Request validation failed", "details": [...] }
```

## Security Baseline (Day 1)

- Central AuthGuard (Bearer validation on all routes except @Public)
- Central AuthorizationGuard (role-based access)
- Global rate limiting (NestJS Throttler — X-RateLimit headers)
- Helmet security headers (CSP, HSTS, X-Frame-Options, etc.)
- Audit log service (structured logging, no PII)
- MPIN + lockout enforced at gateway (policy)
- DTO validation everywhere (class-validator + forbidNonWhitelisted)
- HTTPS enforcement middleware
- JSON-only content type enforcement
