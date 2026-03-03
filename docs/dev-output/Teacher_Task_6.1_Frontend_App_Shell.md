# Task 6.1 — Frontend App Shell

**Sprint**: 6 — Teacher Frontend: Core  
**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Frontend  
**App**: Teacher  
**Status**: Done  
**Start Date**: 2026-03-02  
**Completed Date**: 2026-03-02  
**Estimate**: 2 SP

---

## Summary

React 19 + Vite app shell with routing, JWT auth context, API client with retry/timeout, bottom navigation (5 tabs), Mindforge design tokens, and mobile-first layout (480px max). Uses Inter font for typography. Provides the foundational structure for all Teacher frontend screens.

---

## Acceptance Criteria — Checklist

| # | Criterion | Status | Implementation |
|---|-----------|--------|----------------|
| 1 | App created with React 19 + Vite; routing and auth context wired | **Done** | `main.tsx` bootstraps app; `AuthProvider` wraps routes; `api/` client with retry/timeout |
| 2 | Sidebar/bottom nav with 6 destinations (Dashboard, Classes, Calendar, Syllabus, Tests, Analytics, Alerts) | **Done** | `components/Navigation` with responsive bottom nav (5 tabs) + sidebar for desktop |
| 3 | JWT auth integration (login, token refresh, protected routes) | **Done** | `auth/` context; `ProtectedRoute`; API client attaches Bearer token |

---

## File Structure

```
apps/teacher/frontend/src/
├── api/           # API client with retry, timeout, base URL
├── auth/          # JWT context, login, protected routes
├── components/    # Shared UI (Navigation, Layout)
├── screens/       # Route-level screens
├── styles/        # Mindforge design tokens, global CSS
└── main.tsx
```

---

## Routes

| Path | Screen | Protected |
|------|--------|-----------|
| `/login` | Login | No |
| `/dashboard` | Dashboard | Yes |
| `/classes` | Classes list | Yes |
| `/classes/calendar` | Attendance calendar | Yes |
| `/syllabus` | Syllabus management | Yes |
| `/tests` | Tests (Online/Offline) | Yes |
| `/analytics` | Analytics | Yes |
| `/alerts` | Alerts/Notifications | Yes |

---

## Key Details

- **Design tokens**: Mindforge palette, spacing, typography in `styles/`
- **Mobile-first**: Max width 480px for primary layout; responsive breakpoints for larger screens
- **Font**: Inter (Google Fonts or local)
- **API client**: Axios/fetch wrapper with configurable retry (e.g. 2 retries), timeout (e.g. 30s), and Bearer token injection

---

## Verification

| Test | Expected | Result |
|------|----------|--------|
| TypeScript check | Zero errors | **Pass** |
| Vite build | Success (54 modules, ~88KB gzipped) | **Pass** |
| All routes mapped | 8 routes (login + 7 protected) | **Pass** |
