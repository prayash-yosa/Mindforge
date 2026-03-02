# Mindforge App Interaction Diagram

**Date**: March 2, 2026  
**Version**: 1.0

---

## 1. High-Level Traffic Flow

All client applications communicate with backend services exclusively through the API Gateway. No frontend ever calls a backend service directly.

```
┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ┌────────────┐
│  Student UI │  │  Parent UI  │  │  Teacher UI  │  │  Admin UI  │
│   :5173     │  │   :5174     │  │    :5175     │  │   :5176    │
└──────┬──────┘  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘
       │                │                │                 │
       └────────────────┼────────────────┼─────────────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │    API Gateway      │
              │       :3000         │
              │  ┌───────────────┐  │
              │  │ JWT Validation│  │
              │  │ RBAC Guard    │  │
              │  │ Route Proxy   │  │
              │  └───────────────┘  │
              └─────────┬───────────┘
                        │
          ┌─────────────┼─────────────────┬──────────────┐
          │             │                 │              │
          ▼             ▼                 ▼              ▼
   ┌────────────┐ ┌────────────┐  ┌────────────┐ ┌────────────┐
   │  Student   │ │   Parent   │  │  Teacher   │ │   Admin    │
   │  Service   │ │  Service   │  │  Service   │ │  Service   │
   │   :3001    │ │   :3002    │  │   :3003    │ │   :3004    │
   └────────────┘ └────────────┘  └────────────┘ └────────────┘
```

## 2. Gateway Routing Rules

| URL Prefix | Target Service | Required Role |
|-----------|----------------|---------------|
| `/api/student/*` | Student Service `:3001` | `student` |
| `/api/parent/*` | Parent Service `:3002` | `parent` |
| `/api/teacher/*` | Teacher Service `:3003` | `teacher` |
| `/api/admin/*` | Admin Service `:3004` | `admin` |
| `/api/health` | Gateway (self) | public |
| `/api/auth/*` | Gateway (self) | public |

## 3. Authentication Flow

```
┌──────────┐         ┌──────────────┐
│  Client  │──POST──▶│   Gateway    │
│  (any)   │ /auth   │  /api/auth   │
└──────────┘         └──────┬───────┘
                            │
                     Validate credentials
                     (role-specific login)
                            │
                     Issue JWT with:
                       sub, role, name,
                       iat, exp
                            │
                     ┌──────▼───────┐
                     │  JWT Token   │
                     │  returned    │
                     └──────────────┘
```

All subsequent requests include `Authorization: Bearer <token>`. The gateway:
1. Validates the JWT signature and expiry.
2. Extracts the `role` claim.
3. Checks the role against the RBAC route rules.
4. Proxies to the target service with user identity headers.

## 4. Inter-Service Communication (Future)

In v1, services do not call each other directly. All communication goes through the gateway. Future phases may introduce:

- **Direct service-to-service calls**: Using internal JWT or mTLS for authentication.
- **Event bus**: For async events (e.g., teacher uploads material, student service gets notified).
- **Shared database views**: Read-only cross-service queries via database views or materialized views.

### Rules for Inter-Service Communication

1. Never bypass the RBAC layer for external-facing requests.
2. Internal calls must use service-level auth tokens (not user tokens).
3. Each service owns its data — no direct cross-service DB access.
4. Prefer async messaging over synchronous calls when latency is acceptable.

## 5. Data Flow Examples

### Student submits homework
```
Student UI → Gateway (JWT + RBAC) → Student Service → DB
```

### Parent views child's attendance
```
Parent UI → Gateway (JWT + RBAC) → Parent Service → DB
```

### Teacher uploads material
```
Teacher UI → Gateway (JWT + RBAC) → Teacher Service → Object Storage + DB
```

### Admin views system analytics
```
Admin UI → Gateway (JWT + RBAC) → Admin Service → DB (aggregations)
```
