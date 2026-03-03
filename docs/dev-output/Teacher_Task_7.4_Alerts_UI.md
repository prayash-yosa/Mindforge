# Task 7.4 — Alerts UI

**Sprint**: 7 — Teacher Frontend: Content & Assessments  
**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Frontend  
**App**: Teacher  
**Status**: Done  
**Start Date**: 2026-03-02  
**Completed Date**: 2026-03-02  
**Estimate**: 1 SP

---

## Summary

Notification list with category filters, priority-colored borders, read/unread state, mark-all-read action, and unread count badge. Displays alerts from the notifications pipeline (attendance, performance, system).

---

## Acceptance Criteria — Checklist

| # | Criterion | Status | Implementation |
|---|-----------|--------|----------------|
| 1 | Alerts screen: list with filters, priority styling, read/unread, mark all read | **Done** | `screens/AlertsScreen` with filter chips and alert cards |
| 2 | API wiring: fetch alerts, mark read, unread count | **Done** | Integrates with notifications/alerts API; badge in nav |

---

## Key Details

- **Category filters**: Attendance, Performance, System (or similar); filter chips above list
- **Priority-colored borders**: High (red), Medium (amber), Low (gray)
- **Read/unread**: Visual distinction (e.g. bold for unread); tap to mark read
- **Mark all read**: Button to bulk mark; updates unread count
- **Unread badge**: Bell icon in nav shows count; syncs with API

---

## Verification

| Test | Expected | Result |
|------|----------|--------|
| TypeScript check | Zero errors | **Pass** |
| Vite build | Success (54 modules, ~88KB gzipped) | **Pass** |
| All routes mapped | Alerts at `/alerts` | **Pass** |
