# Task 8.5 — AI Orchestrator

**Sprint**: 8 — Teacher-Grounded AI Integration  
**Status**: Done  
**Date**: 2026-02-20

## Overview

AiOrchestratorService builds the system prompt enforcing retrieval-only answering with [chunk:{id}] citation format. Retrieved chunks are injected as the sole context. Uses temperature 0.15. Calls existing AiProviderService. Includes conversation history (last 6 messages). On timeout or error → "Not found in provided material." (fail closed). Prompt structure matches Architecture §7.3.

## Implementation

### System Prompt

- Enforces retrieval-only answering
- Instructs model to cite sources using `[chunk:{chunk_id}]` format
- No general knowledge; only use provided chunks

### Context Injection

- Retrieved chunks injected as sole context
- Format per Architecture §7.3:
  ```
  [chunk:{id_1}] {chunk_text_1}
  [chunk:{id_2}] {chunk_text_2}
  ...
  ```

### Parameters

- **Temperature**: 0.15 (low for deterministic, grounded responses)
- **Model**: Uses existing AiProviderService configuration

### Conversation History

- Last 6 messages included for follow-up context
- Enables multi-turn doubt resolution

### Failure Handling

- **Timeout**: Return "Not found in provided material."
- **API error**: Return "Not found in provided material."
- **Fail closed**: Never return ungrounded or hallucinated content

## Files Created/Modified

- `backend/src/modules/activities/ai-orchestrator.service.ts` — AiOrchestratorService
- `backend/src/modules/activities/doubt.service.ts` — Integrates AiOrchestrator into doubt flow

## Architecture

Sits between RetrievalService (Task 8.4) and ResponseValidatorService (Task 8.6). Implements Architecture §7.3 prompt structure. Called by DoubtService after retrieval; passes validated response to ResponseValidator.

## Testing

1. Provide valid retrieved chunks; verify AI response includes [chunk:{id}] citations
2. Provide empty chunks; verify "Not found in provided material."
3. Simulate AI timeout; verify fail-closed response
4. Verify conversation history (last 6 messages) included in prompt
