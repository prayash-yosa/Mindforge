# Mindforge Student Experience — Planner Backlog

**Artifact name**: Mindforge_Student_Experience_Planner_Backlog  
**Role**: Planner / Scrum Master AI Agent  
**Date**: February 20, 2026  
**Mode**: Enterprise (V3) -- production, releases, hardening, teacher-grounded AI  

**Sources (no scope expansion)**:
- Architecture: `docs/architecture/final/Mindforge_Student_Experience_Technical_Architecture_Final.md`
- UX Spec: `docs/Mindforge_Student_Experience_UX_Design_Specification.md`

**Capacity**: 1 engineer = 8–10 SP/sprint · 20% buffer · AI work = probabilistic (confidence % in forecast)

---

## Plan: Mindforge Student Experience — Release 1

### Buckets (Sprint / Epic)

| Bucket | Type | Focus |
|--------|------|--------|
| **Sprint 1** | Sprint | Foundation & Auth |
| **Sprint 2** | Sprint | Data & Backend Core |
| **Sprint 3** | Sprint | Today's Plan & Activities API |
| **Sprint 4** | Sprint | AI Integration & Grading |
| **Sprint 5** | Sprint | Attendance & Doubts API |
| **Sprint 6** | Sprint | Client — Login, Home, Activity, Results |
| **Sprint 7** | Sprint | Client — Attendance, Doubts, Profile & Sync |
| **Sprint 8** | Sprint | Teacher-Grounded AI Integration & DevOps |

---

## Sprint 1 — Foundation & Auth

**Capacity**: 10 SP (1 eng) · Buffer 20% → 8 SP target

---

### Task 1.1 — API gateway and request validation

**Labels**: Type: Hardening | AI: Non-AI | Risk: Low | Area: Backend — API

**Notes**:
- **As a** backend system  
- **I want** a REST API gateway with request validation and consistent error shape  
- **So that** all clients get validated input and predictable `{ code, message, details? }` and HTTP status (4xx/5xx).  
- **Mode**: V2  
- **Type**: Hardening  
- **Dependencies**: None.  
- **Risks**: None.

**Checklist**:
- [ ] REST API layer accepts HTTPS only; JSON request/response.
- [ ] Request body and query validation in place; invalid input returns 400 and consistent error shape.
- [ ] Error response shape `{ code, message, details? }` for 400, 401, 403, 404, 429, 500.
- [ ] Health check endpoint for load balancer.
- [ ] No business or DB logic in API layer; delegates to business layer.

**Estimate**: 2 SP

---

### Task 1.2 — MPIN verify and token/session issuance

**Labels**: Type: Feature | AI: Non-AI | Risk: Medium | Area: Backend — Auth

**Notes**:
- **As a** student  
- **I want** to enter my 6-digit MPIN and receive a session/token when correct  
- **So that** I can access the app without re-entering MPIN until session expires.  
- **Mode**: V2  
- **Type**: Feature  
- **Dependencies**: Task 1.1 (API gateway); Data layer for students and sessions (can be stubbed for Sprint 1 then wired in Sprint 2).  
- **Risks**: R7 MPIN brute-force — rate limiting and lockout must be implemented; audit failed attempts.

**Checklist**:
- [ ] `POST /auth/mpin/verify` implemented; accepts 6-digit MPIN; validates against stored hash (no MPIN in logs or client).
- [ ] On success: issue short-lived token or session; return token/session (e.g. Bearer); client can use for subsequent requests.
- [ ] On failure: return 401 and clear error message; do not leak whether MPIN or identity was wrong.
- [ ] Rate limiting and lockout policy documented and implemented (e.g. 5 attempts → lockout; per Light Architecture R7).
- [ ] Sensitive operations (failed/success login) written to audit_log.

**Estimate**: 3 SP

---

### Task 1.3 — Lockout status and Forgot MPIN entry points

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Backend — Auth

**Notes**:
- **As a** student  
- **I want** to see lockout status and have a Forgot MPIN path  
- **So that** I know when I can retry and can recover access via supported flow.  
- **Mode**: V2  
- **Type**: Feature  
- **Dependencies**: Task 1.2 (sessions and lockout state).  
- **Risks**: None.

**Checklist**:
- [ ] `POST /auth/lockout/status` returns current lockout state (e.g. locked until timestamp, attempts remaining).
- [ ] `POST /auth/forgot-mpin` initiates recovery (e.g. OTP to registered contact); no implementation of full OTP flow required in v1 if out of scope — endpoint exists and returns 202 or documented behavior.
- [ ] API error shape consistent; 429 or 403 for lockout where appropriate.

**Estimate**: 2 SP

---

### Task 1.4 — Auth middleware and Bearer token validation

**Labels**: Type: Hardening | AI: Non-AI | Risk: Low | Area: Backend — API

**Notes**:
- **As a** backend  
- **I want** all protected routes to validate Bearer token/session  
- **So that** only authenticated students can call student endpoints.  
- **Mode**: V2  
- **Type**: Hardening  
- **Dependencies**: Task 1.2.  
- **Risks**: None.

**Checklist**:
- [ ] Middleware validates token/session on all routes except `/auth/*` and health.
- [ ] Invalid or expired token → 401 with consistent error shape.
- [ ] Authenticated student_id available to business layer for scope (no cross-student access).

**Estimate**: 1 SP

---

**Sprint 1 total**: 8 SP (within 10 SP capacity with buffer)

---

## Sprint 2 — Data & Backend Core

**Capacity**: 10 SP · Buffer 20% → 8 SP target

---

### Task 2.1 — Database schema and migrations

**Labels**: Type: Hardening | AI: Non-AI | Risk: Low | Area: Backend — Data

**Notes**:
- **As a** system  
- **I want** a versioned schema for students, syllabus, activities, questions, responses, attendance, doubts, sessions, audit  
- **So that** all backend features have a single source of truth and migrations are repeatable.  
- **Mode**: V2  
- **Type**: Hardening  
- **Dependencies**: None.  
- **Risks**: None.

**Checklist**:
- [ ] Tables: students, syllabus_metadata, activities, questions, responses, attendance, doubt_threads, sessions, audit_log per architecture §5.1. (teacher_materials, teacher_material_chunks, ai_usage_logs added in Sprint 8.)
- [ ] Indexes on student_id, activity_id, date (attendance), syllabus keys.
- [ ] Migrations versioned and idempotent; applied via CI/deploy.
- [ ] No direct DB access from business layer; only via data access layer.

**Estimate**: 3 SP

---

### Task 2.2 — Data access layer (repositories/DAOs)

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Backend — Data

**Notes**:
- **As a** business layer  
- **I want** repositories for students, syllabus, activities, questions, responses, attendance, doubts, sessions  
- **So that** I can read/write data without touching SQL in business logic.  
- **Mode**: V2  
- **Type**: Feature  
- **Dependencies**: Task 2.1.  
- **Risks**: None.

**Checklist**:
- [ ] CRUD and queries for students, sessions, syllabus_metadata, activities, questions, responses, attendance, doubt_threads.
- [ ] All queries scoped by student_id or tenant where applicable; parameterized; no raw concatenation.
- [ ] Transient DB errors handled with retry/backoff; duplicate/key errors mapped to 409 or domain message.

**Estimate**: 3 SP

---

### Task 2.3 — Business layer skeleton and dependency injection

**Labels**: Type: Hardening | AI: Non-AI | Risk: Low | Area: Backend — Business

**Notes**:
- **As a** API layer  
- **I want** a business logic layer that receives validated requests and calls data access only  
- **So that** no DB access happens in API and all use cases go through one place.  
- **Mode**: V2  
- **Type**: Hardening  
- **Dependencies**: Task 2.2.  
- **Risks**: None.

**Checklist**:
- [ ] Business services for: auth (MPIN verify, lockout), today's plan, activities, grading, attendance, doubts (stubs OK where not yet implemented).
- [ ] API layer calls business layer only; business layer calls data access and external (AI provider, embedding model) only.
- [ ] Domain exceptions (e.g. InvalidMPIN, LockedOut, ActivityNotFound) mapped to API codes/messages; no stack to client.

**Estimate**: 2 SP

---

**Sprint 2 total**: 8 SP

---

## Sprint 3 — Today's Plan & Activities API

**Capacity**: 10 SP · Buffer 20% → 8 SP target

---

### Task 3.1 — GET /student/today (today's plan)

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Backend — Business

**Notes**:
- **As a** student  
- **I want** to get my today's tasks (homework, quiz, gaps) and progress summary  
- **So that** I see my Home screen content (pending tasks, completed today).  
- **Mode**: V2  
- **Type**: Feature  
- **Dependencies**: Task 2.2, 2.3.  
- **Risks**: None.

**Checklist**:
- [ ] `GET /student/today` returns today's tasks (homework, quiz, gap-bridge), progress summary; auth required; scoped by student_id.
- [ ] Response shape supports UX: task cards (title, type, syllabus ref, question count, estimated time), completed today, progress numerator/denominator.
- [ ] Empty state supported (e.g. no tasks); consistent JSON and HTTP status.

**Estimate**: 2 SP

---

### Task 3.2 — GET /student/activities/:type/:id and POST pause

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Backend — Business

**Notes**:
- **As a** student  
- **I want** to open an activity (homework/quiz/test) and see questions, and to pause and save progress  
- **So that** I can do activities and leave mid-way without losing progress.  
- **Mode**: V2  
- **Type**: Feature  
- **Dependencies**: Task 2.2, 2.3.  
- **Risks**: None.

**Checklist**:
- [ ] `GET /student/activities/:type/:id` returns activity metadata and questions (e.g. for Activity screen); auth; scoped by student_id.
- [ ] `POST /student/activities/:type/:id/pause` saves progress and marks pause; client can resume later.
- [ ] Types: homework, quiz, test; 404 if not found or not assigned to student.

**Estimate**: 2 SP

---

### Task 3.3 — POST /student/activities/:type/:id/respond (submit answer, deterministic grading)

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Backend — Business

**Notes**:
- **As a** student  
- **I want** to submit my answer and get correct/incorrect (and optional AI feedback later)  
- **So that** my progress is saved and I see immediate result for objective questions.  
- **Mode**: V2  
- **Type**: Feature  
- **Dependencies**: Task 3.2; AI feedback deferred to Sprint 4.  
- **Risks**: None.

**Checklist**:
- [ ] `POST /student/activities/:type/:id/respond` accepts questionId, answer, optional requestFeedbackLevel.
- [ ] Business layer evaluates answer (deterministic/rubric for MCQs and simple types); persists response via data access; returns correct/incorrect and next question or completion.
- [ ] If requestFeedbackLevel present, can return placeholder or defer to Task 4.x for AI feedback.
- [ ] Progress and attempt stored; idempotency considered for duplicate submit.

**Estimate**: 3 SP

---

### Task 3.4 — GET /student/results/:type/:id

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Backend — Business

**Notes**:
- **As a** student  
- **I want** to see my activity result (score, breakdown, next suggestions) after completion  
- **So that** I see the Results screen with performance breakdown and suggested next.  
- **Mode**: V2  
- **Type**: Feature  
- **Dependencies**: Task 3.3.  
- **Risks**: None.

**Checklist**:
- [ ] `GET /student/results/:type/:id` returns score, per-question breakdown (correct/incorrect), and suggested next activities; auth; scoped by student_id.
- [ ] Response shape supports UX: score display, list of question results, suggested next task cards.

**Estimate**: 1 SP

---

**Sprint 3 total**: 8 SP

---

## Sprint 4 — AI Integration & Grading

**Capacity**: 10 SP · Buffer 20% → 8 SP target · **AI confidence**: ~75% (probabilistic)

---

### Task 4.1 — AI provider integration and timeout/fallback

**Labels**: Type: Feature | AI: AI | Risk: Medium | Area: Backend — Integration

**Notes**:
- **As a** business layer  
- **I want** to call an AI provider for generation/evaluation with timeout and fallback  
- **So that** we get AI feedback without exposing raw errors to the client.  
- **Mode**: V2  
- **Type**: Feature  
- **Dependencies**: Task 2.3.  
- **Risks**: R1 (hallucination), R6 (latency). Timeout (e.g. 10s) → fallback hint; provider error → "Couldn't get feedback. Try again?" and optional cached hint.

**Checklist**:
- [ ] Outbound HTTP to AI provider (e.g. OpenAI-compatible or Google); prompts use minimal context (pseudonymous ID, syllabus scope); no raw PII.
- [ ] Timeout (e.g. 10s); on timeout return fallback (e.g. standard hint from syllabus); on provider error return user-friendly message and optional cached hint.
- [ ] Responses validated (e.g. syllabus alignment check) before storage/display; no raw AI errors to client.
- [ ] Token usage and caps considered; cost tiering (cheap for grading, higher for doubt/concept) per architecture §9.

**Estimate**: 3 SP

---

### Task 4.2 — GET /student/activities/:type/:id/feedback (progressive guidance levels)

**Labels**: Type: Feature | AI: AI | Risk: Medium | Area: Backend — Business

**Notes**:
- **As a** student  
- **I want** to request the next level of AI guidance (Hint → Approach → Concept → Solution) after an incorrect answer  
- **So that** I get progressive help without direct answers by default.  
- **Mode**: V2  
- **Type**: Feature  
- **Dependencies**: Task 3.3, 4.1.  
- **Risks**: R2 over-helping — enforce guidance levels in business layer; "full solution" gated; UX reflects help level.

**Checklist**:
- [ ] `GET /student/activities/:type/:id/feedback` (or equivalent) returns next guidance level for current question; level tracked (1–4: Hint, Approach, Concept, Solution).
- [ ] Business layer enforces level order; no skipping to solution unless allowed by product rule; response includes help level and content.
- [ ] AI prompt includes syllabus context and question/attempt only; response persisted via data access; fallback on AI failure per Task 4.1.

**Estimate**: 3 SP

---

### Task 4.3 — Deterministic and AI-assisted grading rules

**Labels**: Type: Feature | AI: AI | Risk: Low | Area: Backend — Business

**Notes**:
- **As a** system  
- **I want** deterministic scoring for objective questions and optional AI for open-ended, with rubric storage  
- **So that** grading is fair and explainable (R3).  
- **Mode**: V2  
- **Type**: Feature  
- **Dependencies**: Task 3.3, 4.1.  
- **Risks**: R3 — deterministic for objective; clear rubric and explanations.

**Checklist**:
- [ ] MCQs and simple types use deterministic or cheap structured evaluation; open-ended may use AI with rubric.
- [ ] Rubric and correct answer stored; score and feedback level stored per response.
- [ ] No PII in AI grading prompts; pseudonymous ID and syllabus scope only.

**Estimate**: 2 SP

---

**Sprint 4 total**: 8 SP

---

## Sprint 5 — Attendance & Doubts API

**Capacity**: 10 SP · Buffer 20% → 8 SP target

---

### Task 5.1 — GET /student/attendance (summary and calendar data)

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Backend — Business

**Notes**:
- **As a** student  
- **I want** to see my attendance summary (present/absent days) and calendar data for the selected period  
- **So that** I can view the Attendance screen (Screen 5) with summary and calendar (P/A/–).  
- **Mode**: V2  
- **Type**: Feature  
- **Dependencies**: Task 2.2, 2.3. Attendance source TBD; read-only for student per architecture.  
- **Risks**: R8 — attendance accuracy; read-only; label period/source.

**Checklist**:
- [ ] `GET /student/attendance` accepts query e.g. period (this month, term); returns summary (present count, absent count) and per-day data for calendar (P/A/–).
- [ ] Auth; scoped by student_id; read-only; no write endpoint for student.
- [ ] Empty and error states (no data for period, network error) supported; response shape matches UX (summary + calendar array).

**Estimate**: 2 SP

---

### Task 5.2 — Doubts: GET list, GET thread, POST message with syllabus context

**Labels**: Type: Feature | AI: AI | Risk: Medium | Area: Backend — Business

**Notes**:
- **As a** student  
- **I want** to create and view doubt threads with syllabus context (Class, Subject, Chapter, Topic)  
- **So that** AI answers are syllabus-aligned and I can continue conversations in context.  
- **Mode**: V2  
- **Type**: Feature  
- **Dependencies**: Task 4.1, 2.2, 2.3.  
- **Risks**: R1 syllabus drift — context passed to AI; validation layer.

**Checklist**:
- [ ] `GET /student/doubts` returns list of threads or current thread.
- [ ] `GET /student/doubts/:threadId` returns thread messages.
- [ ] `POST /student/doubts` creates message with syllabus context (class, subject, chapter, topic); business layer calls AI with context; stores messages via data access; minimal PII in prompts.
- [ ] `GET /student/syllabus/tree` returns Class → Subject → Chapter → Topic for Doubts context selector.

**Estimate**: 3 SP

---

### Task 5.3 — GET /student/profile and GET /student/sync/status

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Backend — Business

**Notes**:
- **As a** student  
- **I want** to see my profile (display name, class, board, progress overview) and sync status  
- **So that** Profile screen and sync conflict UX work.  
- **Mode**: V2  
- **Type**: Feature  
- **Dependencies**: Task 2.2, 2.3.  
- **Risks**: None.

**Checklist**:
- [ ] `GET /student/profile` returns display_name, class, board, progress overview; auth; scoped by student_id.
- [ ] `GET /student/sync/status` returns last sync timestamp and optional conflict hint (e.g. "newer progress on another device"); business layer implements conflict detection where applicable.

**Estimate**: 2 SP

---

**Sprint 5 total**: 7 SP

---

## Sprint 6 — Client: Login, Home, Activity, Results

**Capacity**: 10 SP · Buffer 20% → 8 SP target

---

### Task 6.1 — Client app shell and API client (auth, REST, error shape)

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Frontend

**Notes**:
- **As a** client app  
- **I want** a single API client that sends Bearer token, parses consistent error shape, and supports retry  
- **So that** all screens can call backend consistently and handle errors per UX.  
- **Mode**: V2  
- **Type**: Feature  
- **Dependencies**: API contract (Sprint 1–3).  
- **Risks**: None.

**Checklist**:
- [ ] API client: base URL, auth header (Bearer/session), JSON request/response; parse `{ code, message, details? }` on error.
- [ ] Retry and timeout configurable; network errors trigger retry/offline UX per spec.
- [ ] Optional local queue for offline actions and sync state (stub OK for Sprint 6).

**Estimate**: 2 SP

---

### Task 6.2 — Login screen (Screen 1) per UX spec

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Frontend

**Notes**:
- **As a** student  
- **I want** to enter my 6-digit MPIN on the Login screen with keypad and see error/lockout states  
- **So that** I can authenticate and reach Home.  
- **Mode**: V2  
- **Type**: Feature  
- **Dependencies**: Task 6.1; API 1.2, 1.3.  
- **Risks**: None.

**Checklist**:
- [ ] Route `/login`; 6-digit MPIN input (dots), on-screen keypad; Enter and Forgot MPIN link per UX.
- [ ] States: default, entering, loading, error (red border, message, attempts remaining), locked (keypad disabled, countdown).
- [ ] On success: store token/session; navigate to Home. Accessibility: aria-label, role=alert for error/lockout.

**Estimate**: 2 SP

---

### Task 6.3 — Home screen (Screen 2) — Today's Plan

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Frontend

**Notes**:
- **As a** student  
- **I want** to see Today's Plan with task cards, progress bar, and completed today  
- **So that** I can start homework, quiz, or gap-bridge from one place.  
- **Mode**: V2  
- **Type**: Feature  
- **Dependencies**: Task 6.1; API 3.1.  
- **Risks**: None.

**Checklist**:
- [ ] Route `/home`; call `GET /student/today`; display greeting, progress bar, pending task cards (Start), completed today, gap alert card; bottom nav (Home, Attendance, Doubts, Profile).
- [ ] States: loading (skeleton), default, empty ("All caught up!"), syncing banner, offline badge, error (pull to refresh).
- [ ] Tap task card → navigate to Activity; tap My Attendance → Attendance screen. Colors and logo per UX (sage green, deep brown, cream).

**Estimate**: 2 SP

---

### Task 6.4 — Activity screen (Screen 3) — question, answer submit, AI feedback panel

**Labels**: Type: Feature | AI: AI | Risk: Medium | Area: Frontend

**Notes**:
- **As a** student  
- **I want** to see the current question, submit my answer, and see AI feedback (progressive levels) or fallback  
- **So that** I learn with hints rather than direct answers.  
- **Mode**: V2  
- **Type**: Feature  
- **Dependencies**: Task 6.1; API 3.2, 3.3, 4.2.  
- **Risks**: AI failure UX — "View Standard Hint" / "Try Again" per UX.

**Checklist**:
- [ ] Route `/activity/:type/:id`; load activity and questions; display question, answer input, Check Answer; progress bar (e.g. question X of N).
- [ ] On submit: loading → correct (green, Next) or incorrect (AI feedback panel with Try Again / More Help); help level 1–4 visible.
- [ ] States: AI thinking indicator; AI error with "View Standard Hint" and "Try Again"; offline save. Pause/exit saves progress (POST pause).
- [ ] Accessibility: question labelled, AI feedback aria-live, progress aria-label.

**Estimate**: 3 SP

---

### Task 6.5 — Results screen (Screen 4)

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Frontend

**Notes**:
- **As a** student  
- **I want** to see my score, performance breakdown, and suggested next after completing an activity  
- **So that** I know how I did and what to do next.  
- **Mode**: V2  
- **Type**: Feature  
- **Dependencies**: Task 6.1; API 3.4.  
- **Risks**: None.

**Checklist**:
- [ ] Route `/results/:type/:id`; call `GET /student/results/:type/:id`; display score, star rating, question breakdown (✓/✗), Review Mistakes, Suggested Next, Back to Home.
- [ ] States: loading (skeleton), success, perfect score celebration, offline note. Navigation to next activity or Home per UX.

**Estimate**: 1 SP

---

**Sprint 6 total**: 10 SP (at cap; consider moving 1 task to Sprint 7 if needed)

---

## Sprint 7 — Client: Attendance, Doubts, Profile & Sync

**Capacity**: 10 SP · Buffer 20% → 8 SP target

---

### Task 7.1 — Attendance screen (Screen 5) — calendar and summary

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Frontend

**Notes**:
- **As a** student  
- **I want** to see my attendance summary (present/absent days) and calendar view for the selected period  
- **So that** I know how many days I was present or absent.  
- **Mode**: V2  
- **Type**: Feature  
- **Dependencies**: Task 6.1; API 5.1.  
- **Risks**: None.

**Checklist**:
- [ ] Route `/attendance`; call `GET /student/attendance` with period; display summary (present/absent counts), calendar grid (P/A/–), period selector, legend and source label.
- [ ] States: loading (skeleton), default, empty ("No attendance data for this period"), error (retry), offline. Read-only; no edit. Accessibility: summary and cells announced.

**Estimate**: 2 SP

---

### Task 7.2 — Doubts screen (Screen 6) with syllabus context selector

**Labels**: Type: Feature | AI: AI | Risk: Medium | Area: Frontend

**Notes**:
- **As a** student  
- **I want** to chat with the AI tutor with Class → Subject → Chapter → Topic context so answers are syllabus-aligned  
- **So that** I can clear doubts without open-internet drift.  
- **Mode**: V2  
- **Type**: Feature  
- **Dependencies**: Task 6.1; API 5.2 (doubts + syllabus tree).  
- **Risks**: R1 — context selector mandatory; AI responses validated per backend.

**Checklist**:
- [ ] Route `/doubts`; syllabus context at top (Class · Subject · Chapter · Topic with Change); load syllabus tree for selector; send context with each message.
- [ ] GET/POST doubts; display thread messages; input and Send; states: loading (AI thinking), empty ("Ask a doubt..."), error (Retry).
- [ ] Context change does not clear thread; optional message "Context changed to [Topic]." Bottom nav; accessibility for chat and context.

**Estimate**: 3 SP

---

### Task 7.3 — Profile screen and logout

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Frontend

**Notes**:
- **As a** student  
- **I want** to see my profile (name, class, board, progress) and log out  
- **So that** I can confirm my identity and end my session.  
- **Mode**: V2  
- **Type**: Feature  
- **Dependencies**: Task 6.1; API 5.3.  
- **Risks**: None.

**Checklist**:
- [ ] Profile screen: call `GET /student/profile`; display name, class, board, progress overview; logout clears token and navigates to Login.
- [ ] Link to Attendance from Profile if in UX. Settings placeholder OK for v1.

**Estimate**: 1 SP

---

### Task 7.4 — Sync status and conflict modal

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Frontend

**Notes**:
- **As a** student  
- **I want** to see sync status and, on conflict, choose "Use latest?" or "Keep current"  
- **So that** multi-device use is safe and transparent.  
- **Mode**: V2  
- **Type**: Feature  
- **Dependencies**: Task 6.1, 6.3; API 5.3 (sync status).  
- **Risks**: None.

**Checklist**:
- [ ] Poll or use `GET /student/sync/status`; show "Syncing..." / "All caught up!" where applicable.
- [ ] On conflict hint: show modal "Found newer progress on another device" with [Use latest?] [Keep current]; implement action per backend contract.
- [ ] Offline queue and sync when online (stub or full per scope).

**Estimate**: 2 SP

---

**Sprint 7 total**: 8 SP

---

## Sprint 8 -- Teacher-Grounded AI Integration & DevOps

**Capacity**: 10 SP + overflow from architectural scope. Buffer 20%. Target: 10 SP.

**Sprint 8 objective**: Replace NotebookLM integration with Teacher-Grounded AI system. Implement teacher content upload, PDF parsing, chunking pipeline, embedding generation, vector search, AI retrieval orchestration, strict response validation, and supporting DevOps. No frontend tasks.

---

### Task 8.1 -- Teacher upload API and file storage integration

**Labels**: Type: Feature | AI: Non-AI | Risk: Medium | Area: Backend -- Activities Module

**Notes**:
- **As a** teacher  
- **I want** to upload PDF/notes via an API with file validation  
- **So that** my study material is securely stored and available for student AI queries.  
- **Mode**: V3  
- **Type**: Feature  
- **Dependencies**: Task 2.1, 2.2, 2.3.  
- **Risks**: File type abuse; oversized uploads; storage cost.

**Checklist**:
- [ ] Teacher upload endpoint accepts PDF, DOCX, TXT files with size limit (e.g. 20MB).
- [ ] File type validation (MIME + extension); reject disallowed types with 400.
- [ ] File stored in cloud object storage (S3/GCS) with server-side encryption; `storage_path` recorded.
- [ ] `teacher_materials` table: id, teacher_id, class, subject, file_name, file_type, storage_path, status (processing/ready/failed), uploaded_at.
- [ ] `teacher-content.repository` created: CRUD for teacher_materials; query by teacher_id, class, subject, status.
- [ ] `teacher-content.service` created: handles upload, validation, storage, status lifecycle.
- [ ] Access control: only authenticated teacher role can upload; material associated with teacher_id and class.
- [ ] Audit log entry for each upload.

**Estimate**: 2 SP

---

### Task 8.2 -- PDF parsing and chunking pipeline

**Labels**: Type: Feature | AI: AI | Risk: Medium | Area: Backend -- Activities Module

**Notes**:
- **As a** system  
- **I want** to parse uploaded PDFs/docs into text and split into semantic chunks  
- **So that** content is ready for embedding and retrieval.  
- **Mode**: V3  
- **Type**: Feature  
- **Dependencies**: Task 8.1.  
- **Risks**: R5 -- poor quality parsing; variable PDF formats.

**Checklist**:
- [ ] PDF text extraction (e.g. pdf-parse or equivalent); DOCX/TXT extraction.
- [ ] Text cleaning: remove headers/footers/page numbers, normalize whitespace.
- [ ] Chunking: split into segments of ~500 tokens with ~50 token overlap; preserve paragraph boundaries where possible.
- [ ] Each chunk tagged with material_id, chunk_index, and syllabus_ref (class, subject, chapter, topic derived from material metadata).
- [ ] `teacher_material_chunks` table: id, material_id (FK), chunk_text, chunk_index, embedding_vector (pgvector), syllabus_class, syllabus_subject, syllabus_chapter, syllabus_topic, created_at.
- [ ] Processing runs as async job/worker (not blocking upload request).
- [ ] On parse failure: mark teacher_materials status=failed; log error; allow teacher retry.

**Estimate**: 2 SP

---

### Task 8.3 -- Embedding generation and vector storage

**Labels**: Type: Feature | AI: AI | Risk: Medium | Area: Backend -- Activities Module

**Notes**:
- **As a** system  
- **I want** to generate vector embeddings for each chunk and store in pgvector  
- **So that** semantic similarity search is possible at query time.  
- **Mode**: V3  
- **Type**: Feature  
- **Dependencies**: Task 8.2.  
- **Risks**: Embedding API cost; latency for large documents.

**Checklist**:
- [ ] Call embedding model API (e.g. OpenAI embeddings or equivalent) for each chunk.
- [ ] Store embedding_vector in teacher_material_chunks using pgvector column type.
- [ ] pgvector extension enabled on PostgreSQL; HNSW or IVFFlat index on embedding_vector for fast similarity search.
- [ ] `embeddings.repository` created: insert chunks with embeddings; vector similarity search (cosine distance) scoped by class/subject/chapter; return top-K results with scores.
- [ ] Batch processing: embed multiple chunks per API call where supported; handle rate limits and retries.
- [ ] On embedding failure: mark material status=failed; allow retry.
- [ ] Update teacher_materials status to ready after all chunks embedded.

**Estimate**: 2 SP

---

### Task 8.4 -- Retrieval service (vector search integration)

**Labels**: Type: Feature | AI: AI | Risk: Medium | Area: Backend -- Activities Module

**Notes**:
- **As a** activities service  
- **I want** to search teacher material by semantic similarity when a student asks a question  
- **So that** only relevant teacher content is retrieved for AI context.  
- **Mode**: V3  
- **Type**: Feature  
- **Dependencies**: Task 8.3.  
- **Risks**: R1 -- low retrieval quality; R9 -- cross-class access.

**Checklist**:
- [ ] `retrieval.service` created: accepts student question + syllabus context (class, subject, chapter, topic) + student_id.
- [ ] Embeds student question using same embedding model.
- [ ] Performs vector similarity search on teacher_material_chunks via embeddings.repository; scoped by class and teacher(s) assigned to student.
- [ ] Returns top-K chunks (configurable, e.g. K=5) with similarity scores.
- [ ] Confidence threshold: if best match score is below configurable threshold (e.g. 0.7 cosine similarity), returns empty result (triggers "Not found in provided material." downstream).
- [ ] Access control enforced: student can only search material from their assigned class teacher(s); no cross-class access.

**Estimate**: 1 SP

---

### Task 8.5 -- AI retrieval orchestration service

**Labels**: Type: Feature | AI: AI | Risk: Medium | Area: Backend -- Activities Module

**Notes**:
- **As a** activities service  
- **I want** to build retrieval-augmented prompts and call the AI provider with strict grounding rules  
- **So that** AI responses are based solely on teacher material.  
- **Mode**: V3  
- **Type**: Feature  
- **Dependencies**: Task 4.1, 8.4.  
- **Risks**: R1 -- hallucination; R2 -- over-helping.

**Checklist**:
- [ ] `ai-orchestrator.service` created: accepts retrieved chunks + student question + syllabus context.
- [ ] Builds prompt with: (a) system prompt enforcing retrieval-only answering, (b) retrieved chunks with chunk IDs, (c) student question.
- [ ] System prompt includes: "Answer ONLY from the provided context. Do not use your training data. If the answer is not in the provided context, respond exactly: Not found in provided material. Cite sources using [chunk:{id}] format."
- [ ] Temperature set to 0.1-0.2; max tokens capped.
- [ ] Calls existing AiProviderService (from Task 4.1) with constructed prompt.
- [ ] On AI timeout or error: return "Not found in provided material." (fail closed).
- [ ] Token usage logged via ai-usage.repository.

**Estimate**: 1 SP

---

### Task 8.6 -- Strict response validator service

**Labels**: Type: Feature | AI: AI | Risk: Low | Area: Backend -- Activities Module

**Notes**:
- **As a** system  
- **I want** to validate every AI response for citations and on-topic alignment before returning to student  
- **So that** no ungrounded or hallucinated answers reach the student.  
- **Mode**: V3  
- **Type**: Feature  
- **Dependencies**: Task 8.5.  
- **Risks**: R1 -- hallucination leak if validator is bypassed.

**Checklist**:
- [ ] `response-validator.service` created: accepts AI response text + list of available chunk IDs.
- [ ] Parses response for [chunk:{id}] citations; validates cited IDs exist in retrieved set.
- [ ] If no valid citation found: reject response; return "Not found in provided material."
- [ ] If response contains content not attributable to cited chunks (heuristic check): flag and reject.
- [ ] Validated response includes: answer text, cited_chunk_ids array, confidence indicator.
- [ ] Rejection events logged in ai_usage_logs with reason.

**Estimate**: 1 SP

---

### Task 8.7 -- AI usage logging and monitoring

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Backend -- Activities Module / DevOps

**Notes**:
- **As a** system  
- **I want** to log all AI usage (tokens, latency, retrieval stats) and monitor for cost and quality  
- **So that** we can track AI costs and detect quality drift.  
- **Mode**: V3  
- **Type**: Feature  
- **Dependencies**: Task 8.5, 8.6, 2.1.  
- **Risks**: None.

**Checklist**:
- [ ] `ai_usage_logs` table: id, student_id, feature_type (homework_gen/quiz_gen/doubt/feedback/grading), model_used, tokens_used (prompt + completion), latency_ms, retrieval_chunk_count, retrieval_top_score, response_status (accepted/rejected), timestamp.
- [ ] `ai-usage.repository` created: insert logs; aggregation queries (tokens per day, per student, per feature; rejection rate).
- [ ] All AI calls (orchestrator, grading, feedback) log to ai_usage_logs via repository.
- [ ] Monitoring alerts: daily token usage threshold; high rejection rate alert; latency spike alert.

**Estimate**: 1 SP

---

### Task 8.8 -- Security: file validation, access control, and audit

**Labels**: Type: Hardening | AI: Non-AI | Risk: Medium | Area: Backend -- Security

**Notes**:
- **As a** system  
- **I want** strict file validation for teacher uploads, access control for material retrieval, and audit logging  
- **So that** the system is secure against malicious uploads and unauthorized data access.  
- **Mode**: V3  
- **Type**: Hardening  
- **Dependencies**: Task 8.1, 8.4.  
- **Risks**: Malicious file upload; cross-class data leakage.

**Checklist**:
- [ ] File validation: MIME type check, file extension whitelist (pdf, docx, txt), file size limit, basic malware scan (ClamAV or equivalent).
- [ ] Access control: teacher can only upload for their assigned classes; student retrieval scoped by class/teacher association enforced at repository level.
- [ ] No student endpoint exposes raw teacher material; material accessed only through AI-mediated responses.
- [ ] Audit log: upload events, retrieval events, rejected AI responses.
- [ ] Rate limiting on upload endpoint.

**Estimate**: 1 SP

---

### Task 8.9 -- DevOps: storage bucket, embedding worker, deployment, monitoring

**Labels**: Type: Hardening | AI: Non-AI | Risk: Low | Area: DevOps

**Notes**:
- **As a** team  
- **I want** cloud storage for teacher files, an async embedding worker, CI/CD, and monitoring  
- **So that** the teacher-grounded AI pipeline runs reliably in production.  
- **Mode**: V3  
- **Type**: Hardening  
- **Dependencies**: Task 8.1, 8.2, 8.3.  
- **Risks**: None.

**Checklist**:
- [ ] Cloud storage bucket (S3/GCS) provisioned in India region; server-side encryption; access policy (backend-only).
- [ ] Embedding worker: async job runner (queue-based or cron) for processing new teacher uploads (parse -> chunk -> embed). Retry on failure.
- [ ] CI/CD pipeline: build and test on commit; deploy to staging then production; DB migrations (including pgvector extension and new tables) versioned and applied in deploy.
- [ ] API behind HTTPS load balancer; containers; DB managed with pgvector enabled.
- [ ] Secrets vault: AI API key, embedding API key, storage credentials in vault; no secrets in code.
- [ ] Monitoring: health checks; latency/error metrics; AI usage dashboard (tokens, retrieval hit rate, rejection rate); alert on 5xx, auth failures, high AI cost.
- [ ] `teaching_feed` table migration: drop table (replaced by teacher_materials + teacher_material_chunks).

**Estimate**: 2 SP

---

**Sprint 8 total**: 13 SP (overflows standard 10 SP capacity; recommend splitting into Sprint 8a and 8b if single-engineer constraint applies, or allocating 2 sprints)

---

## Risk Register (Planner)

| ID | Risk | Mitigation | Owner |
|----|------|------------|--------|
| R1 | AI hallucination / off-topic | Retrieval-only prompting; citation-required validation; fail closed; "Not found in provided material." | Backend |
| R2 | Over-helping | Enforce guidance levels in business layer; full solution gated; UX shows level | Backend + Frontend |
| R3 | Grading fairness | Deterministic scoring for objective; rubric storage; clear explanations | Backend |
| R4 | Data privacy (minors) | Minimize PII to AI; consent; encryption; deletion path | Backend + DevOps |
| R5 | Teacher material quality / coverage | "Not found" by design; coverage metrics for teachers; no fabrication | Backend |
| R6 | Connectivity / latency | Cache, retry, offline/sync states in UI | Backend + Frontend |
| R7 | MPIN brute-force | Rate limiting, lockout, audit failed attempts | Backend |
| R8 | Attendance accuracy | Read-only for student; label period/source | Backend |
| R9 | Teacher material access control | Retrieval scoped by class/teacher; enforced at repository layer | Backend |

---

## Forecast Summary

| Sprint | Focus | SP | Confidence |
|--------|--------|-----|------------|
| 1 | Foundation & Auth | 8 | 95% |
| 2 | Data & Backend Core | 8 | 95% |
| 3 | Today's Plan & Activities | 8 | 90% |
| 4 | AI Integration | 8 | 75% (AI probabilistic) |
| 5 | Attendance & Doubts API | 7 | 85% |
| 6 | Client -- Login, Home, Activity, Results | 10 | 85% |
| 7 | Client -- Attendance, Doubts, Profile | 8 | 85% |
| 8 | Teacher-Grounded AI Integration & DevOps | 13 | 70% (AI + infra; recommend split) |

**Total**: ~70 SP over 8 sprints. Sprint 8 expanded to accommodate teacher-grounded AI pipeline (replacing NotebookLM). No frontend scope expansion; all backend/infra. **No UI, navigation, or API contract changes.**

---

## New Services and Repositories (v3)

### New Services (inside /modules/activities)

| Service | File | Responsibility |
|---------|------|---------------|
| **TeacherContentService** | teacher-content.service.ts | Teacher material upload, file validation, PDF parsing, text chunking, embedding generation orchestration, material status lifecycle. |
| **RetrievalService** | retrieval.service.ts | Vector similarity search over teacher_material_chunks scoped by class/subject/chapter. Returns top-K chunks with confidence scores. Enforces access control. |
| **AiOrchestratorService** | ai-orchestrator.service.ts | Builds retrieval-augmented prompts (system prompt + retrieved chunks + student question). Calls AI provider. Enforces strict retrieval-only rules. |
| **ResponseValidatorService** | response-validator.service.ts | Validates AI responses for chunk citations, on-topic alignment. Rejects ungrounded responses. Returns "Not found in provided material." on failure. |

### New Repositories (inside /modules/activities)

| Repository | File | Responsibility |
|------------|------|---------------|
| **TeacherContentRepository** | teacher-content.repository.ts | CRUD for teacher_materials table. Query by teacher_id, class, subject, status. |
| **EmbeddingsRepository** | embeddings.repository.ts | CRUD for teacher_material_chunks. Vector similarity search (pgvector cosine distance). Query by material_id, syllabus_ref. Scoped by class/teacher. |
| **AiUsageRepository** | ai-usage.repository.ts | Insert and query ai_usage_logs. Aggregations for monitoring. |

### New DB Tables

| Table | Key Columns |
|-------|-------------|
| **teacher_materials** | id, teacher_id, class, subject, file_name, file_type, storage_path, status, uploaded_at |
| **teacher_material_chunks** | id, material_id (FK), chunk_text, chunk_index, embedding_vector (pgvector), syllabus_class, syllabus_subject, syllabus_chapter, syllabus_topic, created_at |
| **ai_usage_logs** | id, student_id, feature_type, model_used, tokens_used, latency_ms, retrieval_chunk_count, retrieval_top_score, response_status, timestamp |

### Removed

| Item | Reason |
|------|--------|
| **teaching_feed** table | Replaced by teacher_materials + teacher_material_chunks. NotebookLM dependency removed. |
| **TeachingFeedRepository** | No longer needed. |

---

## STANDARD HANDOFF -- To Dev Agent

```
============================================
HANDOFF: Planner / Scrum Master AI Agent -> Dev Agent
============================================

PROJECT: Mindforge Student Experience

ARTIFACT SOURCE: docs/planning/Mindforge_Student_Experience_Planner_Backlog.md

PLANNING STATUS: Backlog and sprints defined (v3); Sprint 8 updated for Teacher-Grounded AI Integration.

WHAT THE DEV RECEIVES:
- Plan: Mindforge Student Experience -- Release 1
- Buckets: Sprints 1-8 (Foundation & Auth -> Data Core -> Today's Plan & Activities -> AI Integration -> Attendance & Doubts API -> Client Login/Home/Activity/Results -> Client Attendance/Doubts/Profile -> Teacher-Grounded AI Integration & DevOps)
- Sprint 8 NEW tasks: Teacher upload API, PDF parsing, chunking, embedding generation, vector search, AI orchestration, response validation, AI usage logging, security hardening, DevOps (storage, worker, deployment, monitoring)
- Tasks: Each task has Title, User story, Acceptance criteria (Checklist), Dependencies, Risks, Labels
- New services: teacher-content.service, retrieval.service, ai-orchestrator.service, response-validator.service
- New repositories: teacher-content.repository, embeddings.repository, ai-usage.repository
- New tables: teacher_materials, teacher_material_chunks, ai_usage_logs
- Removed: teaching_feed table, NotebookLM integration
- Risk register: R1-R9 with mitigations and owner area

CONSTRAINTS (DO NOT BREAK):
- UX is locked. No screen, flow, or feature changes.
- Architecture v3 is locked (teacher-grounded AI). Implement as specified.
- Modular rules: Controllers = HTTP only, Services = business logic only, Repositories = DB only. No cross-module DB access.
- Security baseline preserved. Teacher material access control enforced.
- API contracts unchanged. No new student-facing endpoints.
- AI must fail closed: "Not found in provided material." on any retrieval or validation failure.

DEV NEXT STEPS:
1. Implement in sprint order; Sprint 8 tasks replace previous 8.1-8.5.
2. Use Checklist per task as acceptance criteria.
3. Enforce strict AI governance: retrieval-only prompting, citation validation, fail closed.
4. Run tests and migrations per CI/CD; include pgvector extension setup.

BLOCKERS: None.

DEPENDENCIES:
- Reads: docs/architecture/final/Mindforge_Student_Experience_Technical_Architecture_Final.md (v3)
- Reads: docs/Mindforge_Student_Experience_UX_Design_Specification.md
- Reads: docs/Mindforge_Student_Experience_Light_Architecture_v2.md (v3)

============================================
Signature: Planner / Scrum Master AI Agent (v3) -- Mindforge Student Experience
============================================
```
