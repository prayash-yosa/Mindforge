# Task 4.3 — Offline Printable Test Generation & PDF Export

**Sprint**: 4 — Tests & Evaluation Backend  
**Labels**: Type: Feature | AI: AI | Risk: Medium | Area: Teacher Backend — Tests  
**App**: Teacher  
**Status**: Done  
**Start Date**: 2026-03-02  
**Completed Date**: 2026-03-02  
**Estimate**: 3 SP

---

## Summary

Implemented offline test generation supporting all 7 question types including numericals (when has_numericals is true). AI generates questions with stepwise solutions for numerical problems. PDF content generation produces structured Student Question Paper and Teacher Answer Key with section grouping, marks distribution, and formatted headers.

---

## Acceptance Criteria — Checklist

| # | Criterion | Status | Implementation |
|---|-----------|--------|----------------|
| 1 | Offline test generation uses concept summaries + has_numericals flag | **Done** | OfflineTestGenerationService reads lesson session data and adapts question mix |
| 2 | Student Question Paper and Teacher Answer Key PDFs | **Done** | generatePdfContent() produces both with formatted sections |
| 3 | Numericals and model answers follow syllabus constraints | **Done** | AI prompt includes stepwise solution requirement; fallback includes step templates |

---

## API Contract

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/v1/tests/generate/offline` | Generate AI questions for an offline test |
| GET | `/v1/tests/:testId/pdf` | Get structured PDF content (student paper + answer key) |

---

## PDF Output Structure

**Student Question Paper**: School header, metadata (subject, marks, duration, date), student name/roll fields, sections grouped by question type with marks per question.

**Teacher Answer Key**: Confidential header, all questions with correct answers, explanations, and stepwise solutions for numericals.

---

## Verification

- **Build**: `npx nest build` — zero errors
- **Boot**: Routes mapped for generate/offline and PDF retrieval
- **Question types**: All 7 types supported (MCQ, FIB, T/F, very short, short, long, numerical)
- **Fallback**: Works without AI API key with placeholder questions
