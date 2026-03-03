# Task 6.2 — Dashboard Screen

**Sprint**: 6 — Teacher Frontend: Core  
**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Frontend  
**App**: Teacher  
**Status**: Done  
**Start Date**: 2026-03-02  
**Completed Date**: 2026-03-02  
**Estimate**: 2 SP

---

## Summary

Teacher dashboard with personalized greeting, KPI cards (2x2 grid), today's classes list, recent alerts section, and bell icon for notifications. Provides at-a-glance overview of class performance and daily schedule.

---

## Acceptance Criteria — Checklist

| # | Criterion | Status | Implementation |
|---|-----------|--------|----------------|
| 1 | Layout per UX: greeting, KPI cards (2x2), today's classes, recent alerts, bell icon | **Done** | `screens/DashboardScreen` with responsive grid; bell icon links to `/alerts` |
| 2 | API integration with loading, error, and empty states | **Done** | Fetches KPIs and today's sessions; skeletons on load; error/empty fallbacks |

---

## KPI Cards

| Card | Data Source | Display |
|------|-------------|---------|
| Average Score | Analytics API | Class average (or "—" if no data) |
| Attendance % | Analytics API | Percentage for selected class |
| Total Students | Class/Students API | Count of enrolled students |
| Tests This Week | Analytics API | Number of tests scheduled |

---

## Key Details

- **Greeting**: "Good morning/afternoon/evening, [Teacher Name]"
- **Today's classes**: List of sessions for current date; links to attendance marking
- **Recent alerts**: Last 3–5 alerts; "View all" links to `/alerts`
- **Bell icon**: Unread count badge; navigates to alerts screen

---

## Verification

| Test | Expected | Result |
|------|----------|--------|
| TypeScript check | Zero errors | **Pass** |
| Vite build | Success (54 modules, ~88KB gzipped) | **Pass** |
| All routes mapped | Dashboard at `/dashboard` | **Pass** |
