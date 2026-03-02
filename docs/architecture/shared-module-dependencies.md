# Mindforge Shared Module Dependency Chart

**Date**: March 2, 2026  
**Version**: 1.0

---

## 1. Overview

The `@mindforge/shared` package (`shared/`) is the only cross-app dependency in the monorepo. It contains authentication types, API contracts, constants, validation schemas, and utility functions that are reused by all applications and the gateway.

**Rule**: No app-specific business logic belongs in `@mindforge/shared`. If logic is only relevant to one app, it stays in that app.

## 2. Package Structure

```
shared/src/
├── index.ts                          # Re-exports all modules
├── auth/
│   ├── index.ts
│   ├── roles.enum.ts                 # UserRole { STUDENT, PARENT, TEACHER, ADMIN }
│   ├── jwt-payload.interface.ts      # JwtPayload, AuthenticatedUser
│   └── rbac.types.ts                 # Permission, RolePermissionMap, RouteRbacRule, DEFAULT_ROUTE_RBAC
├── interfaces/
│   ├── index.ts
│   └── api-response.interface.ts     # ApiResponse<T>, ApiErrorDetail, ApiMeta
├── constants/
│   ├── index.ts
│   └── error-codes.ts                # ErrorCodes, ErrorCode type
├── common-utils/
│   └── index.ts                      # (placeholder — add cross-app helpers here)
└── validation/
    └── index.ts                      # (placeholder — add shared validators here)
```

## 3. Dependency Matrix

Which packages import which shared modules:

| Consumer | auth | interfaces | constants | common-utils | validation |
|----------|:----:|:----------:|:---------:|:------------:|:----------:|
| **API Gateway** | Yes | Yes | Yes | — | — |
| **Student Backend** | Yes | Yes | Yes | Yes | Yes |
| **Parent Backend** | Yes | Yes | Yes | Yes | Yes |
| **Teacher Backend** | Yes | Yes | Yes | Yes | Yes |
| **Admin Backend** | Yes | Yes | Yes | Yes | Yes |
| **Student Frontend** | — | Yes | Yes | — | — |
| **Parent Frontend** | — | Yes | Yes | — | — |
| **Teacher Frontend** | — | Yes | Yes | — | — |
| **Admin Frontend** | — | Yes | Yes | — | — |

Notes:
- Backend services import the full shared package.
- Frontend apps typically only import `interfaces` (API response types) and `constants` (error codes) for type-safe API consumption. They do not import auth guards or RBAC types.

## 4. How to Reference Shared

In any workspace package's `package.json`:

```json
{
  "dependencies": {
    "@mindforge/shared": "*"
  }
}
```

npm workspaces resolves `*` to the local `shared/` package. In source code:

```typescript
import { UserRole, AuthenticatedUser, JwtPayload } from '@mindforge/shared';
import { ApiResponse, ErrorCodes } from '@mindforge/shared';
```

## 5. Adding to Shared

Before adding code to `@mindforge/shared`, verify:

1. **Used by 2+ apps** — if only one app needs it, keep it local.
2. **No app-specific business logic** — shared code must be domain-agnostic.
3. **Backward compatible** — changes must not break existing consumers.
4. **Exported from index.ts** — all public API must be re-exported from `shared/src/index.ts`.

### Process

1. Add the new file under the appropriate sub-module (`auth/`, `interfaces/`, etc.).
2. Export from the sub-module's `index.ts`.
3. Export from the root `shared/src/index.ts`.
4. Run `npm run build` in `shared/` (or `turbo run build --filter=@mindforge/shared`).
5. Consumers can now import the new types/functions.

## 6. Build Order

Turborepo ensures `@mindforge/shared` is always built before any consumer:

```
@mindforge/shared
    ├── @mindforge/gateway
    ├── @mindforge/student-backend
    ├── @mindforge/parent-backend
    ├── @mindforge/teacher-backend
    └── @mindforge/admin-backend
```

This is enforced by the `"dependsOn": ["^build"]` setting in `turbo.json`.
