# Mindforge RBAC Mapping Matrix

**Date**: March 2, 2026  
**Version**: 1.0

---

## 1. Overview

Mindforge uses Role-Based Access Control (RBAC) to enforce authorization across all four applications. A single JWT token carries the user's role, and the API Gateway enforces route-level access before proxying requests to downstream services.

## 2. Role Definitions

| Role | Enum Value | Description | Login Method |
|------|-----------|-------------|--------------|
| **Student** | `student` | K-12 student using the learning platform | 6-digit MPIN |
| **Parent** | `parent` | Parent/guardian monitoring child's progress | TBD (email/phone + OTP) |
| **Teacher** | `teacher` | Teacher managing content and reviewing student work | TBD (email + password) |
| **Admin** | `admin` | Platform administrator with system-wide access | TBD (email + password + MFA) |

Roles are defined in `@mindforge/shared` as:

```typescript
export enum UserRole {
  STUDENT = 'student',
  PARENT = 'parent',
  TEACHER = 'teacher',
  ADMIN = 'admin',
}
```

## 3. JWT Token Structure

All roles share a unified JWT payload:

```typescript
interface JwtPayload {
  sub: string;       // Unique user identifier
  role: UserRole;    // One of: student, parent, teacher, admin
  name?: string;     // Display name
  iat?: number;      // Issued-at (epoch seconds)
  exp?: number;      // Expiration (epoch seconds)
}
```

## 4. Route Access Matrix

### Gateway-Level (Coarse-Grained)

The gateway enforces which roles can access which URL prefixes:

| Route Prefix | student | parent | teacher | admin | Public |
|-------------|:-------:|:------:|:-------:|:-----:|:------:|
| `/api/auth/*` | — | — | — | — | Yes |
| `/api/health` | — | — | — | — | Yes |
| `/api/student/*` | Yes | — | — | — | — |
| `/api/parent/*` | — | Yes | — | — | — |
| `/api/teacher/*` | — | — | Yes | — | — |
| `/api/admin/*` | — | — | — | Yes | — |

### Service-Level (Fine-Grained) — Future

Each backend service can implement additional permission checks beyond the gateway's route-level RBAC. Examples:

| Service | Resource | student | parent | teacher | admin |
|---------|---------|:-------:|:------:|:-------:|:-----:|
| Student | Own profile | CRUD | — | — | — |
| Student | Activities | R, Submit | — | — | — |
| Student | Attendance | R | — | — | — |
| Parent | Child profile | R | R | — | — |
| Parent | Child attendance | — | R | — | — |
| Parent | Child results | — | R | — | — |
| Teacher | Materials | — | — | CRUD | — |
| Teacher | Student results | — | — | R | — |
| Teacher | Class roster | — | — | R | — |
| Admin | All users | — | — | — | CRUD |
| Admin | System config | — | — | — | CRUD |
| Admin | Analytics | — | — | — | R |

Legend: C = Create, R = Read, U = Update, D = Delete

## 5. RBAC Enforcement Architecture

```
Client Request
      │
      ▼
┌──────────────────────────────────┐
│         API Gateway              │
│                                  │
│  1. Extract Bearer token         │
│  2. Verify JWT signature + exp   │
│  3. Extract role from payload    │
│  4. Match path against RBAC map  │
│  5. Allow or reject (403)        │
│  6. Proxy to target service      │
│     with X-User-Id, X-User-Role │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│       Backend Service            │
│                                  │
│  7. Trust gateway headers        │
│  8. (Optional) fine-grained      │
│     permission check             │
│  9. Execute business logic       │
└──────────────────────────────────┘
```

## 6. Implementation Notes

### Current State (v1)
- Only the Student role is fully implemented with MPIN login.
- Parent, Teacher, and Admin login flows are pending.
- Gateway RBAC guard is a stub — wired but services are shells.

### SSO Design
- Single auth endpoint at the gateway (`/api/auth/*`).
- Login flow determines the role and issues a role-tagged JWT.
- Frontends store the token in sessionStorage and send as `Authorization: Bearer <token>`.
- Token refresh and rotation to be added in a future phase.

### Security Considerations
- Tokens are short-lived (recommended: 15–60 minutes).
- No role escalation — a token for `student` cannot access `/api/admin/*`.
- Service-to-service calls (future) use separate internal tokens, not user tokens.
- Admin access should require MFA (to be implemented).
- All sensitive operations must be audit-logged.
