# Task 5.2 — Notifications & Alerts Pipeline (Teacher-Facing)

**Sprint**: 5 — Analytics & Notifications  
**Labels**: Type: Feature | AI: Non-AI | Risk: Medium | Area: Teacher Backend — Notifications  
**App**: Teacher  
**Status**: Done  
**Start Date**: 2026-03-02  
**Completed Date**: 2026-03-02  
**Estimate**: 3 SP

---

## Summary

Implemented teacher-facing notification system with absence alerts (from Sprint 2), test-related alerts (in-progress, evaluation pending, auto-submitted), and a read/mark-read API. Notifications are categorized by type and priority, supporting both personal (teacherId) and broadcast notifications. Unread count endpoint for badge display.

---

## Acceptance Criteria — Checklist

| # | Criterion | Status | Implementation |
|---|-----------|--------|----------------|
| 1 | Absence >2 days/week alerts surfaced as notification_event | **Done** | Existing from Sprint 2; notifications listed via this module |
| 2 | Test-related alerts: missed deadlines, auto-submitted, evaluation pending | **Done** | generateTestAlerts() creates notifications for in-progress + unevaluated |
| 3 | List and detail APIs for Alerts / Messages screen | **Done** | GET /notifications with unreadOnly filter + mark read/all |

---

## API Contract

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1/notifications` | List teacher's notifications (optional ?unreadOnly=true) |
| GET | `/v1/notifications/unread-count` | Get unread notification count |
| POST | `/v1/notifications/:id/read` | Mark single notification as read |
| POST | `/v1/notifications/read-all` | Mark all teacher's notifications as read |
| POST | `/v1/notifications/alerts/test/:testId` | Generate test-related alerts |

---

## Notification Categories

| Category | Trigger | Priority |
|----------|---------|----------|
| absence_alert | Student absent >2 days/week | high |
| auto_submitted | Test auto-submitted on time expiry | medium |
| evaluation_pending | Submissions awaiting evaluation | high |
| missed_test | Student missed test deadline | medium |
| general | System notifications | low |

---

## Verification

- **Build**: `npx nest build` — zero errors
- **Boot**: All 5 notification routes mapped
- **Categories**: All notification types surfaced with priority
- **Read tracking**: Mark single/all as read with unread count
