# Task 2.2 — Attendance Mark Entry APIs (Per Class Session)

**Sprint**: 2 — Class & Attendance Backend  
**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Backend — Class & Attendance  
**App**: Teacher  
**Status**: Done  
**Start Date**: 2026-03-02  
**Completed Date**: 2026-03-02  
**Estimate**: 3 SP

---

## Summary

Implemented attendance marking APIs with the "default Present, mark Absentees only" pattern. Teachers open a session, see all students defaulted to Present, and submit only the list of absent students. Same-day edit window is enforced via `editable_until`. Per-session and per-day attendance views are provided.

---

## Acceptance Criteria — Checklist

| # | Criterion | Status | Implementation |
|---|-----------|--------|----------------|
| 1 | Open/create class_session, fetch student list with default Present | **Done** | `GET /v1/attendance/session/:sessionId` returns all students with default `present` status |
| 2 | Mark Absent (writes attendance_record with status=ABSENT and notes) | **Done** | `POST /v1/attendance/mark` accepts list of absent students |
| 3 | Enforce same-day edit window via editable_until | **Done** | `EditWindowExpiredException` thrown if `new Date() > editableUntil` |
| 4 | Read APIs for per-session and per-day attendance views | **Done** | Session view + summary with date range filters |

---

## API Contract

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1/attendance/session/:sessionId` | Get attendance for a session (all students with present/absent status) |
| POST | `/v1/attendance/mark` | Mark attendance: submit list of absent students |
| PATCH | `/v1/attendance/record/:recordId` | Update individual attendance record (status or notes) |
| GET | `/v1/attendance/summary` | Get attendance summary with class/period/date filters |

---

## Attendance Flow

1. **Teacher opens session** → `GET /v1/attendance/session/:sessionId`
   - Returns all enrolled students with default `present` status
   - If attendance was already taken, shows saved absent records

2. **Teacher marks absentees** → `POST /v1/attendance/mark`
   - Sends `classSessionId` + array of `absentStudents: [{ studentId, notes? }]`
   - Backend clears previous records for that session, writes absent records
   - Sets `isAttendanceTaken = true` on the session

3. **Same-day edits** → Re-submit `POST /v1/attendance/mark`
   - Allowed until `editable_until` (end of day)
   - After deadline: `403 EDIT_WINDOW_EXPIRED`

---

## DTOs

| DTO | Fields | Validation |
|-----|--------|------------|
| `MarkAttendanceDto` | classSessionId, absentStudents[] | classSessionId required; nested validation |
| `AbsentStudentEntry` | studentId, notes? | studentId required; notes max 500 chars |
| `UpdateAttendanceRecordDto` | status?, notes? | status in ['present','absent']; notes max 500 |

---

## Edit Window Enforcement

```
Session.editableUntil = session.scheduledAt same day at 23:59:59.999
If current time > editableUntil → throw EditWindowExpiredException
```

This ensures attendance can only be modified on the same day as the class.

---

## Verification

| Test | Expected | Result |
|------|----------|--------|
| `nest build` | Zero errors | **Pass** |
| Attendance routes mapped | 4 AttendanceController routes | **Pass** |
| Session attendance returns all students as present by default | Correct default state | **Pass** |
| Mark absent flow | Absent records created, session marked | **Pass** |
