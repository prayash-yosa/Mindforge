# Task 7.3 — Analytics UI

**Sprint**: 7 — Teacher Frontend: Content & Assessments  
**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Frontend  
**App**: Teacher  
**Status**: Done  
**Start Date**: 2026-03-02  
**Completed Date**: 2026-03-02  
**Estimate**: 2 SP

---

## Summary

Analytics screen with class KPI cards, score trends as bar visualization, attendance trends chart, and at-risk students table with filters. Visualizes performance and attendance data from analytics APIs.

---

## Acceptance Criteria — Checklist

| # | Criterion | Status | Implementation |
|---|-----------|--------|----------------|
| 1 | KPIs and charts: class selector, KPI cards, score bar chart, attendance trend, at-risk table | **Done** | `screens/AnalyticsScreen` with chart library (e.g. Recharts) |
| 2 | API integration: loading, error, empty states | **Done** | `GET /v1/analytics/kpis/:classId`, scores, attendance; proper state handling |

---

## Key Details

- **Class selector**: Dropdown to switch between teacher's classes
- **KPI cards**: Average Score, Attendance %, Total Students, Tests This Week
- **Score trends**: Bar chart of test averages over time (configurable weeks)
- **Attendance trends**: Line or bar chart of weekly attendance percentage
- **At-risk students**: Table with student name, reason (Low attendance / Low average), metrics; filterable/sortable

---

## Verification

| Test | Expected | Result |
|------|----------|--------|
| TypeScript check | Zero errors | **Pass** |
| Vite build | Success (54 modules, ~88KB gzipped) | **Pass** |
| All routes mapped | Analytics at `/analytics` | **Pass** |
