# Task 4.4 — Evaluation APIs (Online Auto-Grade + Offline Mark Entry)

**Sprint**: 4 — Tests & Evaluation Backend  
**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Backend — Evaluation  
**App**: Teacher  
**Status**: Done  
**Start Date**: 2026-03-02  
**Completed Date**: 2026-03-02  
**Estimate**: 2 SP

---

## Summary

Implemented dual evaluation system: online auto-grading for objective questions (MCQ/FIB/T-F) with per-question results and explanations, and offline mark entry for teacher-entered scores per student/section/question. Auto-submission for expired attempts creates notification events. Results feed dashboards and student/parent views.

---

## Acceptance Criteria — Checklist

| # | Criterion | Status | Implementation |
|---|-----------|--------|----------------|
| 1 | Online evaluation: auto-grade, attempted/not-attempted counts | **Done** | submitAndGrade() with checkAnswer(), per-question result detail |
| 2 | Offline mark entry per question/section with aggregates | **Done** | enterOfflineMarks() + getOfflineMarksByTest() with per-student summaries |
| 3 | Results feed Teacher dashboards and Student/Parent views | **Done** | Exposed via cross-app read APIs (Sprint 5) |

---

## API Contract

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/v1/evaluation/submit` | Submit answers and auto-grade |
| POST | `/v1/evaluation/auto-submit/:testId` | Auto-submit expired attempts |
| GET | `/v1/evaluation/attempts/:testId` | List attempts for a test |
| GET | `/v1/evaluation/attempts/:testId/student/:studentId` | Get student's attempt |
| POST | `/v1/evaluation/offline-marks` | Enter offline marks (bulk) |
| GET | `/v1/evaluation/offline-marks/:testId` | Get marks summary by test |
| GET | `/v1/evaluation/offline-marks/:testId/student/:studentId` | Get student's offline marks |

---

## Auto-Grading Logic

- MCQ, True/False, Fill-in-Blank: normalized case-insensitive comparison
- Unanswered questions: marked as Not Attempted with 0 marks
- Result includes: per-question detail (student answer, correct answer, isCorrect, explanation, marks awarded)
- Auto-submit: expired in-progress attempts get status `auto_submitted` + notification

---

## Verification

- **Build**: `npx nest build` — zero errors
- **Boot**: All 7 evaluation routes mapped
- **Auto-grade**: Correct normalized comparison for all objective types
- **Notifications**: Auto-submit and mark entry create notification_event entries
