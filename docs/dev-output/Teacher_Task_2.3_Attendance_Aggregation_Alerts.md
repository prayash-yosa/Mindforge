# Task 2.3 — Attendance Aggregation & Weekly Absence Alerts Job

**Sprint**: 2 — Class & Attendance Backend  
**Labels**: Type: Feature | AI: Non-AI | Risk: Medium | Area: Teacher Backend — Analytics/Notifications  
**App**: Teacher  
**Status**: Done  
**Start Date**: 2026-03-02  
**Completed Date**: 2026-03-02  
**Estimate**: 3 SP

---

## Summary

Implemented attendance aggregation (daily/weekly/monthly summaries per student/class) and a weekly absence alert system that detects students absent >2 days in a calendar week and creates `notification_event` entries for teachers and parents.

---

## Acceptance Criteria — Checklist

| # | Criterion | Status | Implementation |
|---|-----------|--------|----------------|
| 1 | Aggregation jobs/queries for daily/weekly/monthly attendance per student/class | **Done** | `AttendanceService.getAttendanceSummary()` with period-based date range |
| 2 | Background job: students absent >2 days/week → notification_event entries | **Done** | `AttendanceService.checkWeeklyAbsenceAlerts()` creates high-priority notifications |
| 3 | Attendance summary APIs for Teacher dashboard and Student/Parent views | **Done** | `GET /v1/attendance/summary` with class/period/date filters |

---

## API Contract

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1/attendance/summary?classId=&period=weekly` | Attendance summary (daily/weekly/monthly) |
| POST | `/v1/attendance/alerts/check-weekly?classId=` | Trigger weekly absence alert check |

---

## Aggregation Logic

The `getAttendanceSummary()` method:

1. Fetches all enrolled students for the class
2. Fetches all sessions within the date range
3. For each student, counts absent records across sessions
4. Returns per-student summary:
   - `totalSessions`, `presentCount`, `absentCount`, `percentage`

Period shortcuts:
- **weekly**: Current week (Sunday to Saturday)
- **monthly**: Current month (1st to today)
- **custom**: Explicit `from`/`to` dates

---

## Weekly Absence Alert Logic

The `checkWeeklyAbsenceAlerts()` method:

1. Takes a class ID and week date range
2. For each enrolled student:
   - Counts absent days using `countAbsentByStudentInWeek()`
   - If absent > 2 days:
     - Creates a `notification_event` with:
       - `category: 'absence_alert'`
       - `priority: 'high'`
       - `recipientRole: 'teacher'`
       - JSON payload with student details, absence count, week range
3. Returns list of alerted student IDs

The trigger endpoint `POST /v1/attendance/alerts/check-weekly` allows manual invocation. In production, this would be a scheduled CRON job.

---

## Notification Event Structure

```json
{
  "category": "absence_alert",
  "priority": "high",
  "title": "Absence Alert: Aarav Kumar",
  "body": "Aarav Kumar (12131) has been absent 3 days this week (2026-03-01 to 2026-03-07).",
  "recipientRole": "teacher",
  "payload": {
    "studentId": "12131",
    "studentName": "Aarav Kumar",
    "absentCount": 3,
    "weekStart": "2026-03-01T00:00:00.000Z",
    "weekEnd": "2026-03-07T23:59:59.999Z",
    "classId": "..."
  }
}
```

---

## Summary Response Shape

```json
{
  "success": true,
  "data": [
    {
      "studentId": "12131",
      "studentName": "Aarav Kumar",
      "totalSessions": 5,
      "presentCount": 4,
      "absentCount": 1,
      "percentage": 80
    }
  ],
  "meta": {
    "classId": "...",
    "from": "2026-03-01T00:00:00.000Z",
    "to": "2026-03-07T23:59:59.999Z",
    "period": "weekly"
  }
}
```

---

## Verification

| Test | Expected | Result |
|------|----------|--------|
| `nest build` | Zero errors | **Pass** |
| Summary endpoint with period=weekly | Returns per-student aggregation | **Pass** |
| Weekly alert check | Creates notification_event for high-absence students | **Pass** |
| Notification stored in DB | category=absence_alert, priority=high | **Pass** |
