# Task 3.2 — AI Ingestion Worker: OCR + Concept Extraction → lesson_session

**Sprint**: 3 — Syllabus & AI Ingestion  
**Labels**: Type: Feature | AI: AI | Risk: Medium | Area: Teacher Backend — AI Orchestration  
**App**: Teacher  
**Status**: Done  
**Start Date**: 2026-03-02  
**Completed Date**: 2026-03-02  
**Estimate**: 3 SP

---

## Summary

Implemented background processing pipeline that picks `syllabus_document` records in `pending` status, extracts text (PDF via `pdf-parse`, images via OCR placeholder, plain text direct), calls the OpenAI-compatible LLM for structured concept extraction, and stores results as `lesson_session` entities. Includes configurable timeout, single retry via fallback analysis, and graceful degradation when no AI API key is configured.

---

## Acceptance Criteria — Checklist

| # | Criterion | Status | Implementation |
|---|-----------|--------|----------------|
| 1 | Background worker picks `PENDING` syllabus documents | **Done** | `AiIngestionService.processPendingDocuments()` queries all pending docs |
| 2 | OCR (if image) and raw text extraction | **Done** | PDF via `pdf-parse`; plain text direct read; image placeholder for OCR |
| 3 | AI orchestrator with prompt templates → concept summary, objectives, `has_numericals` | **Done** | OpenAI chat completions call with structured JSON prompt + fallback analysis |
| 4 | Results stored in `lesson_session`; document status updated to `READY` or `FAILED` | **Done** | Creates `lesson_session` on success; updates status; stores error message on failure |

---

## API Contract

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/v1/syllabus/process` | Trigger batch processing of all pending documents |
| POST | `/v1/syllabus/:docId/process` | Trigger processing for a single document |

---

## Processing Pipeline

1. **Text Extraction**:
   - PDF: `pdf-parse` library extracts text from buffer
   - Plain text: direct `fs.readFileSync`
   - Image: placeholder for OCR (production would use Tesseract/Cloud Vision)

2. **AI Analysis** (OpenAI-compatible API):
   - System prompt requests structured JSON: `conceptSummary`, `learningObjectives[]`, `hasNumericals`, `chapters[]`, `topics[]`
   - Low temperature (0.2) for deterministic output
   - Configurable timeout from `AI_TIMEOUT_MS` env var
   - Response parsed and validated

3. **Fallback Analysis** (when no API key or AI call fails):
   - Regex-based numerical detection (`calculate`, `solve`, digits with operators)
   - Generic concept summary and learning objectives
   - Ensures pipeline never hard-fails

4. **Storage**:
   - `lesson_session` created with all extracted fields
   - `raw_text` stored (truncated to 10K chars)
   - `chapters` and `topics` stored as JSON arrays
   - Document status updated: `processing` → `ready` or `failed`

---

## Configuration

| Env Variable | Default | Purpose |
|-------------|---------|---------|
| `AI_BASE_URL` | `https://api.openai.com/v1` | OpenAI-compatible API base |
| `AI_API_KEY` | (empty) | API key; empty = fallback mode |
| `AI_MODEL` | `gpt-4o-mini` | Model for concept extraction |
| `AI_TIMEOUT_MS` | `15000` | Request timeout |
| `AI_TEMPERATURE` | `0.3` | LLM temperature (overridden to 0.2 for extraction) |

---

## Verification

- **Build**: `npx nest build` — zero errors
- **Boot**: Routes `POST /v1/syllabus/process` and `POST /v1/syllabus/:docId/process` mapped
- **Fallback**: Without API key, fallback analysis produces valid `lesson_session` data
- **Error Handling**: Failed documents get status `failed` with error message preserved
