# Mindforge Workspace Architecture

**Date**: March 2, 2026  
**Version**: 1.0

---

## 1. Overview

Mindforge is a multi-application education platform organized as a monorepo. The workspace contains four independently deployable applications (Student, Parent, Teacher, Admin), a shared core library, an API gateway, and documentation.

## 2. Directory Layout

```
Mindforge/
├── package.json                 # Root: npm workspaces + Turborepo
├── turbo.json                   # Build orchestration & caching
├── tsconfig.base.json           # Shared TypeScript compiler config
│
├── apps/
│   ├── student/
│   │   ├── frontend/            # React 19 + Vite — Student UI
│   │   ├── backend/             # NestJS 10 — Student microservice (:3001)
│   │   └── mobile/              # Android WebView wrapper (Kotlin)
│   ├── parent/
│   │   ├── frontend/            # React 19 + Vite — Parent UI (:5174)
│   │   └── backend/             # NestJS — Parent microservice (:3002)
│   ├── teacher/
│   │   ├── frontend/            # React 19 + Vite — Teacher UI (:5175)
│   │   └── backend/             # NestJS — Teacher microservice (:3003)
│   └── admin/
│       ├── frontend/            # React 19 + Vite — Admin UI (:5176)
│       └── backend/             # NestJS — Admin microservice (:3004)
│
├── services/
│   └── gateway/                 # API Gateway — NestJS (:3000)
│                                  JWT validation, RBAC, service routing
│
├── shared/                      # @mindforge/shared npm package
│   └── src/
│       ├── auth/                # UserRole enum, JWT payload, RBAC types
│       ├── common-utils/        # Cross-app utility functions
│       ├── interfaces/          # API response contracts
│       ├── constants/           # Error codes, shared constants
│       └── validation/          # Shared validation schemas
│
├── docs/                        # Architecture docs, task specs, planning
└── Mindforge.code-workspace     # Multi-root workspace file
```

## 3. Monorepo Tooling

| Tool | Purpose |
|------|---------|
| **npm workspaces** | Dependency hoisting, cross-package `@mindforge/*` references |
| **Turborepo** | Cached parallel builds, task orchestration (`build`, `dev`, `lint`, `test`) |
| **TypeScript** | Shared `tsconfig.base.json` extended by all packages |

Workspace entries (from root `package.json`):
- `apps/*/frontend`
- `apps/*/backend`
- `services/*`
- `shared`

## 4. Application Boundaries

Each application is a self-contained unit with:

- **Its own frontend** — independent React SPA with its own routing, state, and build.
- **Its own backend** — independent NestJS microservice with its own port, database connection, and business logic.
- **No direct dependency on other apps** — apps reference only `@mindforge/shared`, never each other.

### Communication Rules

| Rule | Description |
|------|-------------|
| No hard coupling | Apps never import from each other's source |
| API gateway routing | All client traffic flows through the gateway |
| Service-to-service | HTTP via gateway or direct inter-service calls (not in v1) |
| Shared types only | Cross-app contracts live in `@mindforge/shared` |
| RBAC at gateway | Role enforcement happens before traffic reaches a service |

## 5. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React, Vite, React Router | 19, 7, 7 |
| Backend | NestJS, TypeORM | 10, 0.3 |
| Database | PostgreSQL (prod), SQLite (dev) | — |
| Auth | JWT (jsonwebtoken via @nestjs/jwt) | — |
| Mobile | Android WebView (Kotlin) | — |
| Monorepo | npm workspaces + Turborepo | — |

## 6. Port Allocation

| Service | Default Port |
|---------|-------------|
| API Gateway | 3000 |
| Student Backend | 3001 |
| Parent Backend | 3002 |
| Teacher Backend | 3003 |
| Admin Backend | 3004 |
| Student Frontend | 5173 |
| Parent Frontend | 5174 |
| Teacher Frontend | 5175 |
| Admin Frontend | 5176 |
