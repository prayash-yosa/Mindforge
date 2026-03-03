# Task 5.1 — Teacher Analytics Data APIs (Performance & Attendance)

**Sprint**: 5 — Analytics & Notifications  
**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Backend — Analytics  
**App**: Teacher  
**Status**: Done  
**Start Date**: 2026-03-02  
**Completed Date**: 2026-03-02  
**Estimate**: 3 SP

---

## Summary

Implemented analytics APIs returning class KPIs (average score, attendance %, at-risk students, tests this week) and trend endpoints (score over time, attendance by week). At-risk students are identified by low attendance (<75%) or low average score (<40%). Data aggregated from attendance records, test attempts, and offline mark entries.

---

## Acceptance Criteria — Checklist

| # | Criterion | Status | Implementation |
|---|-----------|--------|----------------|
| 1 | KPI APIs: average score, attendance %, at-risk students, tests this week | **Done** | getClassKpis() aggregates across attendance + test data |
| 2 | Trend endpoints: score over time, attendance by week | **Done** | getScoreTrends() + getAttendanceTrends() with configurable weeks |
| 3 | Optimised via indexes | **Done** | Existing composite indexes on entities support efficient queries |

---

## API Contract

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1/analytics/kpis/:classId` | Class KPIs (avg score, attendance %, at-risk, tests this week) |
| GET | `/v1/analytics/scores/:classId` | Score trends over time |
| GET | `/v1/analytics/attendance/:classId?weeks=` | Attendance trends by week (default 8 weeks) |

---

## Response Shapes

### ClassKpis
- classId, subject, averageScore, attendancePercentage, totalStudents, totalTests, testsThisWeek, atRiskStudents[]

### AtRiskStudent
- studentId, studentName, reason (Low attendance | Low average score), attendancePercentage?, averageScore?

### ScoreTrend
- testId, testTitle, date, classAverage, highestScore, lowestScore, totalStudents

### AttendanceTrend
- week (ISO date), presentPercentage, totalSessions, totalStudents

---

## Verification

- **Build**: `npx nest build` — zero errors
- **Boot**: All 3 analytics routes mapped
- **At-risk detection**: Students with <75% attendance or <40% average flagged
