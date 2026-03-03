# Task 1.1 — Wire Teacher App into Workspace & Gateway Routing

**Sprint**: 1 — Workspace Integration & Teacher Service Foundation  
**Labels**: Type: Hardening | AI: Non-AI | Risk: Low | Area: Workspace / Gateway  
**App**: Teacher  
**Status**: Done  
**Start Date**: 2026-03-02  
**Completed Date**: 2026-03-02  
**Estimate**: 2 SP

---

## Summary

Wired the Teacher frontend and backend into the Mindforge monorepo workspace and updated the API gateway RBAC rules to allow both **Teacher** and **Admin** roles to access teacher routes. The workspace was already configured via glob patterns; RBAC was the key change.

---

## Acceptance Criteria — Checklist

| # | Criterion | Status | Implementation |
|---|-----------|--------|----------------|
| 1 | `apps/teacher/frontend` and `apps/teacher/backend` registered in root package.json workspaces | **Done** | Root `package.json` uses `"apps/*/frontend"` and `"apps/*/backend"` globs — already covers teacher |
| 2 | Teacher routes in `services/gateway` with role Teacher (and Admin) routing to `:3003` | **Done** | `proxy.controller.ts` maps `/api/teacher` → `http://localhost:3003`; RBAC updated |
| 3 | JWT + RBAC path in gateway verified for Teacher role | **Done** | `DEFAULT_ROUTE_RBAC` now includes `[UserRole.TEACHER, UserRole.ADMIN]` for `/api/teacher` |
| 4 | Local dev commands documented | **Done** | Standard workspace commands: `npm run dev --filter @mindforge/teacher-backend` |

---

## Key Changes

### Gateway RBAC Update

**File**: `shared/src/auth/rbac.types.ts`

```
Before: { pathPrefix: '/api/teacher', allowedRoles: [UserRole.TEACHER] }
After:  { pathPrefix: '/api/teacher', allowedRoles: [UserRole.TEACHER, UserRole.ADMIN] }
```

This ensures Admin users can access Teacher APIs for elevated operations (overrides, cross-app analytics).

### Workspace Registration

The root `package.json` workspaces configuration uses glob patterns:

```json
"workspaces": [
  "apps/*/frontend",
  "apps/*/backend",
  "services/*",
  "shared"
]
```

Teacher app directories are automatically included. Turborepo tasks (`build`, `dev`, `lint`, `test`, `clean`) propagate to all workspaces.

### Port Allocation

| Service | Port |
|---------|------|
| Gateway | 3000 |
| Student Backend | 3001 |
| Parent Backend | 3002 |
| **Teacher Backend** | **3003** |
| Admin Backend | 3004 |
| Teacher Frontend | 5175 |

---

## Verification

| Test | Expected | Result |
|------|----------|--------|
| Teacher backend in `npm ls --workspaces` | Listed as `@mindforge/teacher-backend` | **Pass** |
| Gateway SERVICE_MAP includes teacher | `/api/teacher` → `http://localhost:3003` | **Pass** |
| RBAC allows Teacher role | Teacher can access `/api/teacher/*` | **Pass** |
| RBAC allows Admin role | Admin can access `/api/teacher/*` | **Pass** |
| RBAC blocks Student role | Student gets 403 on `/api/teacher/*` | **Pass** |

---

## Notes for Next Tasks

- Task 1.2 depends on this wiring to register the Teacher NestJS service skeleton.
- Gateway proxy is currently a stub; will be replaced with `http-proxy-middleware` for production.
