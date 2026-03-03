# Task 4.2 — Online Daily Quiz AI Question Generation (No Numericals)

**Sprint**: 4 — Tests & Evaluation Backend  
**Labels**: Type: Feature | AI: AI | Risk: Medium | Area: Teacher Backend — AI Orchestration  
**App**: Teacher  
**Status**: Done  
**Start Date**: 2026-03-02  
**Completed Date**: 2026-03-02  
**Estimate**: 3 SP

---

## Summary

Implemented AI-powered question generation pipeline for online daily quizzes. Uses lesson_session concepts and learning objectives to generate MCQ, Fill-in-Blank, and True/False questions. Strictly enforces no-numericals policy via prompt engineering AND post-generation validation filter. Fallback generation when no AI API key is configured.

---

## Acceptance Criteria — Checklist

| # | Criterion | Status | Implementation |
|---|-----------|--------|----------------|
| 1 | AI question generation pipeline using lesson_session concepts | **Done** | QuizGenerationService reads lesson conceptSummary + learningObjectives |
| 2 | Prompt templates + post-validation block numericals for online | **Done** | System prompt forbids numericals; validateNoNumericals() filters post-generation |
| 3 | Store generated questions in test_question linked to test_definition | **Done** | Questions saved via TestRepository.createQuestions() |

---

## API Contract

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/v1/tests/generate/online` | Generate AI questions for an online quiz |

---

## AI Pipeline

1. **Input**: test definition (must be online mode) + linked lesson session
2. **Prompt**: System prompt specifies allowed types (MCQ/FIB/T-F), enforces NO numericals, requests JSON array
3. **Post-validation**: `validateNoNumericals()` filters out any questions with numerical patterns (calculate, solve, find the value)
4. **Storage**: Questions saved to `test_question` with orderIndex, marks, options (JSON), correctAnswer, explanation
5. **Fallback**: Without API key, generates placeholder questions using lesson metadata

---

## Verification

- **Build**: `npx nest build` — zero errors
- **Boot**: `POST /v1/tests/generate/online` route mapped
- **No-numericals**: Both prompt-level and code-level enforcement
- **Fallback**: Works without AI API key
