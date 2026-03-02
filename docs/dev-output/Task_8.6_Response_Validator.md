# Task 8.6 — Response Validator

**Sprint**: 8 — Teacher-Grounded AI Integration  
**Status**: Done  
**Date**: 2026-02-20

## Overview

ResponseValidatorService parses [chunk:{uuid}] citations via regex, validates all cited IDs exist in the retrieved set, and rejects responses with no valid citations. Includes heuristic off-topic check for markers like "based on my training", "as a language model". Returns ValidationResult with isValid, validatedResponse, citedChunkIds, rejectionReason. Invalid → "Not found in provided material."

## Implementation

### Citation Parsing

- **Regex**: Matches `[chunk:{uuid}]` pattern
- **Extraction**: All cited chunk IDs collected from response

### Validation Rules

1. **Citation existence**: All cited IDs must exist in the retrieved chunk set
2. **At least one valid citation**: Response rejected if no valid citations found
3. **Off-topic heuristic**: Check for markers indicating model fallback to general knowledge:
   - "based on my training"
   - "as a language model"
   - "I don't have access to"
   - Similar phrases → reject

### ValidationResult

```typescript
{
  isValid: boolean;
  validatedResponse?: string;
  citedChunkIds: string[];
  rejectionReason?: string;
}
```

### Invalid Response Handling

- If invalid → return "Not found in provided material." to student
- Log rejection in ai_usage_logs (Task 8.7)

## Files Created/Modified

- `backend/src/modules/activities/response-validator.service.ts` — ResponseValidatorService
- `backend/src/modules/activities/doubt.service.ts` — Integrates validator into doubt flow

## Architecture

Final gate before persisting AI response. Called by DoubtService after AiOrchestrator returns. Ensures only citation-grounded responses reach the student. Per Architecture §7: "AI must cite the chunk_id(s) used. ResponseValidatorService rejects any response without valid citation."

## Testing

1. Valid response with [chunk:{uuid}] citations → isValid true, citedChunkIds populated
2. Response with citation to non-retrieved chunk → isValid false
3. Response with no citations → isValid false
4. Response containing "as a language model" → isValid false (off-topic)
5. Invalid response → DoubtService returns "Not found in provided material."
