# Mindforge Teacher App — Planner Backlog

**Artifact name**: Mindforge_Teacher_App_Planner_Backlog  
**Role**: Planner / Scrum Master AI Agent  
**Date**: February 20, 2026  
**Mode**: Enterprise (V3) — teacher app with AI-assisted syllabus & tests  

**Sources (no scope expansion)**:
- Architecture: `docs/architecture/teacher/Mindforge_Teacher_App_Architecture_v1.md`
- UX Spec: `docs/architecture/teacher/Mindforge_Teacher_App_UX_Design_Specification.md`
- Workspace: `docs/architecture/workspace-architecture.md`

**Capacity**: 1 engineer = 8–10 SP/sprint · 20% buffer · AI work = probabilistic (confidence % in forecast)

---

## Plan: Mindforge Teacher App — Release 1

### Buckets (Sprint / Epic)

| Bucket | Type | Focus |
|--------|------|--------|
| **Sprint 1** | Sprint | Workspace integration & Teacher service foundation |
| **Sprint 2** | Sprint | Class & Attendance backend |
| **Sprint 3** | Sprint | Syllabus upload & AI ingestion |
| **Sprint 4** | Sprint | Test authoring, generation & evaluation |
| **Sprint 5** | Sprint | Analytics, notifications & cross-app APIs |
| **Sprint 6** | Sprint | Teacher frontend — Dashboard & Classes |
| **Sprint 7** | Sprint | Teacher frontend — Syllabus, Tests, Analytics, Alerts |
| **Sprint 8** | Sprint | Hardening, observability & AI guardrails |

---

## Sprint 1 — Workspace Integration & Teacher Service Foundation

**Capacity**: 10 SP (1 eng) · Buffer 20% → 8 SP target

---

### Task 1.1 — Wire Teacher app into workspace & gateway routing

**Labels**: Type: Hardening | AI: Non-AI | Risk: Low | Area: Workspace / Gateway

**Notes**:
- **As a** platform team  
- **I want** the Teacher frontend/backend wired into the monorepo and API gateway  
- **So that** Teacher traffic flows via `services/gateway` and respects workspace rules.  
- **Dependencies**: Existing workspace scaffolding.  
- **Risks**: Misconfigured routing could affect other apps.

**Checklist**:
- [ ] Ensure `apps/teacher/frontend` and `apps/teacher/backend` are registered in root `package.json` workspaces and Turborepo tasks.
- [ ] Add Teacher routes in `services/gateway` (NestJS) with role `Teacher` (and `Admin` where required) and routing to `:3003` backend.
- [ ] Verify JWT + RBAC path in gateway for Teacher role.
- [ ] Local dev commands documented (e.g. `pnpm dev --filter apps/teacher/*` or equivalent).

**Estimate**: 2 SP

---

### Task 1.2 — Teacher backend skeleton (NestJS service)

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Backend

**Notes**:
- **As a** backend engineer  
- **I want** a Teacher NestJS service skeleton with core modules and health endpoints  
- **So that** feature modules (attendance, syllabus, tests) can be added cleanly.  
- **Dependencies**: Task 1.1.  
- **Risks**: None.

**Checklist**:
- [ ] Create `apps/teacher/backend` NestJS app with module layout matching architecture (Class & Attendance, Syllabus & AI, Tests, Evaluation, Analytics, Notifications).
- [ ] Implement basic health check and version endpoint.
- [ ] Configure connection to Teacher DB (PostgreSQL/schema per workspace pattern).
- [ ] Ensure no direct imports from other app backends; only `@mindforge/shared`.

**Estimate**: 2 SP

---

### Task 1.3 — Teacher DB schema & migrations (core tables)

**Labels**: Type: Hardening | AI: Non-AI | Risk: Low | Area: Teacher Backend — Data

**Notes**:
- **As a** system  
- **I want** versioned migrations for core Teacher tables  
- **So that** class, attendance, syllabus, tests and notifications share a stable schema.  
- **Dependencies**: Task 1.2.  
- **Risks**: Schema changes impacting analytics later if poorly modelled.

**Checklist**:
- [ ] Define and migrate tables: `teacher` (if needed), `class`, `class_session`, `class_student`, `attendance_record`, `syllabus_document`, `lesson_session`, `test_definition`, `test_question`, `test_attempt`, `offline_mark_entry`, `notification_event` (per architecture v1).
- [ ] Add indexes for `class_session`, `student_id`, dates, and foreign keys.
- [ ] Ensure migrations are idempotent and integrated into CI/CD.

**Estimate**: 3 SP

---

### Task 1.4 — Shared contracts for Teacher APIs in @mindforge/shared

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Shared

**Notes**:
- **As a** cross-app integrator  
- **I want** Teacher DTOs and enums in `@mindforge/shared`  
- **So that** Student/Parent/Admin and Gateway can call Teacher APIs without tight coupling.  
- **Dependencies**: Task 1.2, workspace architecture.  
- **Risks**: Breaking changes if contracts are unstable.

**Checklist**:
- [ ] Add Teacher-specific DTOs/interfaces in `shared/src/interfaces/teacher` (attendance summary, test definition, analytics slices, etc.).
- [ ] Expose Teacher-related auth roles/constants in `shared/src/auth` as needed.
- [ ] Ensure Teacher frontend and backend both consume these shared types.

**Estimate**: 1 SP

---

**Sprint 1 total**: 8 SP

---

## Sprint 2 — Class & Attendance Backend

**Capacity**: 10 SP · Buffer 20% → 8 SP target

---

### Task 2.1 — Class & timetable domain (class, sessions, mappings)

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Backend — Class & Attendance

**Notes**:
- **As a** teacher  
- **I want** classes, sections, timetables and student mappings defined  
- **So that** I can take attendance per class session.  
- **Dependencies**: Task 1.3.  
- **Risks**: None.

**Checklist**:
- [ ] Implement CRUD/APIs for `class`, `class_session`, `class_student` in Teacher backend.
- [ ] Ensure sessions align with 1‑hour slots from timetable; include teacher, subject, datetime.
- [ ] Expose read APIs for Student/Parent/Admin to fetch class info via gateway.

**Estimate**: 2 SP

---

### Task 2.2 — Attendance mark entry APIs (per class session)

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Backend — Class & Attendance

**Notes**:
- **As a** teacher  
- **I want** to mark attendance quickly with default Present and mark only absentees  
- **So that** I can complete attendance in 1–2 clicks per class.  
- **Dependencies**: Task 2.1.  
- **Risks**: Data inconsistency if edits after cut-off are not constrained.

**Checklist**:
- [ ] Implement API to open/create a `class_session` and fetch student list with default Present state.
- [ ] Implement API to mark Absent (writes `attendance_record` with status=ABSENT and notes).
- [ ] Enforce same-day edit window via `editable_until`; return proper error if expired.
- [ ] Provide read APIs for per-session and per-day attendance views.

**Estimate**: 3 SP

---

### Task 2.3 — Attendance aggregation & weekly absence alerts job

**Labels**: Type: Feature | AI: Non-AI | Risk: Medium | Area: Teacher Backend — Analytics/Notifications

**Notes**:
- **As a** teacher  
- **I want** weekly attendance summaries and alerts when a student is absent >2 days/week  
- **So that** I can intervene early with at-risk students.  
- **Dependencies**: Task 2.2.  
- **Risks**: Incorrect aggregation leading to wrong alerts.

**Checklist**:
- [ ] Implement aggregation jobs or queries for daily/weekly/monthly attendance per student/class.
- [ ] Implement background job that finds students absent >2 days in a calendar week and creates `notification_event` entries.
- [ ] Expose attendance summary APIs for Teacher dashboard and Student/Parent views via gateway.

**Estimate**: 3 SP

---

**Sprint 2 total**: 8 SP

---

## Sprint 3 — Syllabus Upload & AI Ingestion

**Capacity**: 10 SP · Buffer 20% → 8 SP target · **AI confidence**: ~75%

---

### Task 3.1 — Syllabus upload API & storage

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Backend — Syllabus

**Notes**:
- **As a** teacher  
- **I want** to upload syllabus files (PDF/Image) tagged with class, subject, date and duration  
- **So that** they are stored and ready for AI processing.  
- **Dependencies**: Task 1.3.  
- **Risks**: Storage/security misconfiguration.

**Checklist**:
- [ ] Implement API to upload files to object storage (e.g. S3) and create `syllabus_document` records with status `PENDING`.
- [ ] Store metadata: class, subject, date, duration (1 hour).
- [ ] Enforce file size and type limits; return clear errors on failure.

**Estimate**: 2 SP

---

### Task 3.2 — AI ingestion worker: OCR + concept extraction → lesson_session

**Labels**: Type: Feature | AI: AI | Risk: Medium | Area: Teacher Backend — AI Orchestration

**Notes**:
- **As a** system  
- **I want** a background worker that runs OCR and LLM-based concept extraction on syllabus documents  
- **So that** I get structured `lesson_session` entities for tests and analytics.  
- **Dependencies**: Task 3.1; AI provider integration available.  
- **Risks**: AI hallucination, OCR errors.

**Checklist**:
- [ ] Implement background worker/queue that picks `syllabus_document` with `PENDING` status.
- [ ] Run OCR (if image) and extract raw text.
- [ ] Call AI orchestrator with prompt templates to produce: concept summary, learning objectives, `has_numericals` flag.
- [ ] Store results in `lesson_session`, update document status to `READY` or `FAILED` with reason.

**Estimate**: 3 SP

---

### Task 3.3 — Syllabus & lesson read APIs for frontend

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Backend — Syllabus

**Notes**:
- **As a** teacher  
- **I want** to see recent uploads, processing status, and extracted chapters/topics and concepts  
- **So that** I can use them to configure tests.  
- **Dependencies**: Task 3.2.  
- **Risks**: None.

**Checklist**:
- [ ] Implement APIs to list syllabus uploads with status (`Processing`, `Ready`, `Failed`).
- [ ] Implement APIs to get chapters/topics and `lesson_session` details (summary, objectives, flags) for a class/subject.
- [ ] Ensure error states (e.g. failed processing) are clearly surfaced for UX.

**Estimate**: 3 SP

---

**Sprint 3 total**: 8 SP

---

## Sprint 4 — Test Authoring, Generation & Evaluation

**Capacity**: 10 SP · Buffer 20% → 8 SP target · **AI confidence**: ~70%

---

### Task 4.1 — Test domain & authoring APIs (online + offline)

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Backend — Tests

**Notes**:
- **As a** teacher  
- **I want** to define online daily quizzes and offline printable tests  
- **So that** I can assess students based on recent syllabus.  
- **Dependencies**: Task 3.3.  
- **Risks**: None.

**Checklist**:
- [ ] Implement `test_definition` and related entities for online daily quiz and offline printable tests.
- [ ] Authoring APIs to create/update test definitions: scope (class, subject, chapter), total marks, duration, question mix.
- [ ] Ensure online quiz definitions enforce objective types only (MCQ/FIB/T/F) at schema level.

**Estimate**: 2 SP

---

### Task 4.2 — Online daily quiz AI question generation (no numericals)

**Labels**: Type: Feature | AI: AI | Risk: Medium | Area: Teacher Backend — AI Orchestration

**Notes**:
- **As a** teacher  
- **I want** AI-generated objective questions for daily quizzes with **no numericals**  
- **So that** I can quickly create quizzes aligned to lessons.  
- **Dependencies**: Task 4.1, 3.2.  
- **Risks**: AI accidentally generating numericals or off-topic content.

**Checklist**:
- [ ] Implement AI question generation pipeline for online quizzes using `lesson_session` concepts and objectives.
- [ ] Enforce prompt templates and post-validation to block numericals (value-solving) for online quizzes.
- [ ] Store generated questions in `test_question` linked to `test_definition`.

**Estimate**: 3 SP

---

### Task 4.3 — Offline printable test generation & PDF export

**Labels**: Type: Feature | AI: AI | Risk: Medium | Area: Teacher Backend — Tests

**Notes**:
- **As a** teacher  
- **I want** AI-assisted offline tests (with numericals and long answers) and downloadable PDFs  
- **So that** I can conduct paper-based exams with answer keys.  
- **Dependencies**: Task 4.1, 3.2.  
- **Risks**: PDF generation reliability; AI answer quality.

**Checklist**:
- [ ] Implement offline test generation that uses concept summaries and `has_numericals` to decide question mix.
- [ ] Generate Student Question Paper and Teacher Answer Key PDFs from `test_question` data.
- [ ] Ensure numericals and model answers follow syllabus and documented constraints.

**Estimate**: 3 SP

---

### Task 4.4 — Evaluation APIs (online auto-grade + offline mark entry)

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Backend — Evaluation

**Notes**:
- **As a** teacher  
- **I want** auto-graded scores for online tests and flows to enter offline marks  
- **So that** I can see complete class performance in one place.  
- **Dependencies**: Task 4.1, 4.2, 4.3.  
- **Risks**: Mis-scoring if question types or marks are misaligned.

**Checklist**:
- [ ] Implement online evaluation logic for objective questions (auto-grade, attempted vs not-attempted counts).
- [ ] Implement APIs for teacher-entered offline marks per question/section and compute aggregates.
- [ ] Ensure results feed Teacher dashboards and Student/Parent views via shared contracts.

**Estimate**: 2 SP

---

**Sprint 4 total**: 10 SP (at cap; consider moving 1 SP to Sprint 5 if needed)

---

## Sprint 5 — Analytics, Notifications & Cross-App APIs

**Capacity**: 10 SP · Buffer 20% → 8 SP target

---

### Task 5.1 — Teacher analytics data APIs (performance & attendance)

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Backend — Analytics

**Notes**:
- **As a** teacher  
- **I want** APIs for KPIs and trends (scores, attendance, at-risk students)  
- **So that** the Results & Analytics dashboard can show class health.  
- **Dependencies**: Tasks 2.3, 4.4.  
- **Risks**: Heavy queries affecting performance.

**Checklist**:
- [ ] Implement APIs returning KPIs (average score, attendance %, at-risk students, tests this week) by class/subject/period.
- [ ] Implement trend endpoints (score over time, attendance by week, weak concepts). 
- [ ] Optimise via indexes or pre-aggregated snapshots where needed.

**Estimate**: 3 SP

---

### Task 5.2 — Notifications & alerts pipeline (teacher-facing)

**Labels**: Type: Feature | AI: Non-AI | Risk: Medium | Area: Teacher Backend — Notifications

**Notes**:
- **As a** teacher  
- **I want** in-app alerts for absences, missed tests and auto-submissions  
- **So that** I never miss important events.  
- **Dependencies**: Tasks 2.3, 4.4.  
- **Risks**: Duplicate or noisy alerts.

**Checklist**:
- [ ] Ensure absence >2 days/week alerts are surfaced as `notification_event` for teacher.
- [ ] Implement test-related alerts: missed deadlines, auto-submitted tests, evaluation pending.
- [ ] Expose list and detail APIs for Alerts / Messages screen.

**Estimate**: 3 SP

---

### Task 5.3 — Cross-app read APIs for Student/Parent/Admin

**Labels**: Type: Feature | AI: Non-AI | Risk: Medium | Area: Teacher Backend — Integration

**Notes**:
- **As a** platform  
- **I want** Teacher backend to expose attendance and performance read APIs for other apps  
- **So that** Student/Parent/Admin can show shared analytics without duplicating logic.  
- **Dependencies**: Task 5.1.  
- **Risks**: Data leaks if RBAC not correctly enforced.

**Checklist**:
- [ ] Implement read-only endpoints (via gateway) for attendance and performance aggregates suitable for Student/Parent/Admin.
- [ ] Use `@mindforge/shared` contracts and enforce RBAC at gateway.

**Estimate**: 2 SP

---

**Sprint 5 total**: 8 SP

---

## Sprint 6 — Teacher Frontend: Dashboard & Classes

**Capacity**: 10 SP · Buffer 20% → 8 SP target

---

### Task 6.1 — Teacher frontend app shell, routing & auth

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Frontend

**Notes**:
- **As a** teacher  
- **I want** a Teacher web app with sidebar navigation and secure access  
- **So that** I can access Dashboard, Classes, Syllabus, Tests, Analytics and Alerts.  
- **Dependencies**: Task 1.1, 1.4.  
- **Risks**: None.

**Checklist**:
- [ ] Create `apps/teacher/frontend` React app using Vite, wired into workspace.
- [ ] Implement sidebar navigation: Dashboard, Classes & Attendance, Syllabus, Tests, Results & Analytics, Alerts / Messages.
- [ ] Integrate auth with JWT from gateway; ensure only Teacher/Admin roles can access.

**Estimate**: 2 SP

---

### Task 6.2 — Dashboard screen (teacher overview)

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Frontend

**Notes**:
- **As a** teacher  
- **I want** a Dashboard with today’s classes, attendance issues, pending test evaluations and alerts  
- **So that** I see my workload at a glance.  
- **Dependencies**: Task 6.1, 5.1, 5.2.  
- **Risks**: None.

**Checklist**:
- [ ] Implement Dashboard layout per UX (KPI cards, today’s timetable, attendance summary, recent alerts).
- [ ] Call Teacher analytics and alerts APIs; show loading, error and empty states.

**Estimate**: 2 SP

---

### Task 6.3 — Classes & Attendance screen (desktop + mobile)

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Frontend

**Notes**:
- **As a** teacher  
- **I want** to take attendance per class session with default Present and mark absentees  
- **So that** I can complete attendance during or right after class.  
- **Dependencies**: Task 2.2, 6.1.  
- **Risks**: UX performance on large classes.

**Checklist**:
- [ ] Implement desktop layout per UX (class/date/session selectors, Present/Absent pills, notes, summary chips, mini-calendar, Save/Mark all present/Undo).
- [ ] Implement mobile layout (card list with big pills, sticky footer actions).
- [ ] Wire to attendance mark entry APIs; handle edit window expiry and network errors.

**Estimate**: 3 SP

---

### Task 6.4 — Attendance calendar & summaries on frontend

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Frontend

**Notes**:
- **As a** teacher  
- **I want** calendar views and summaries of attendance  
- **So that** I can quickly see trends for a class.  
- **Dependencies**: Task 2.3, 6.3.  
- **Risks**: None.

**Checklist**:
- [ ] Integrate mini-calendar and full calendar views with attendance summary APIs.
- [ ] Show present/absent dots and aggregates; honour error/offline states.

**Estimate**: 1 SP

---

**Sprint 6 total**: 8 SP

---

## Sprint 7 — Teacher Frontend: Syllabus, Tests, Analytics, Alerts

**Capacity**: 10 SP · Buffer 20% → 8 SP target

---

### Task 7.1 — Syllabus upload & concepts UI

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Frontend — Syllabus

**Notes**:
- **As a** teacher  
- **I want** to upload syllabus files and inspect AI-extracted chapters/topics and concepts  
- **So that** I can prepare tests and track coverage.  
- **Dependencies**: Task 3.3, 6.1.  
- **Risks**: None.

**Checklist**:
- [ ] Implement Syllabus screen per UX (upload zone, recent uploads with status, left chapters/topics, right concept summary/objectives/flags).
- [ ] Show Processing/Ready/Failed states; expose Retry where backend supports.

**Estimate**: 2 SP

---

### Task 7.2 — Tests UI (online daily quiz + offline printable)

**Labels**: Type: Feature | AI: AI | Risk: Medium | Area: Teacher Frontend — Tests

**Notes**:
- **As a** teacher  
- **I want** to configure online quizzes and offline printable tests  
- **So that** I can generate assessments from recent syllabus.  
- **Dependencies**: Task 4.2, 4.3, 6.1.  
- **Risks**: Misaligned expectations on AI generation latency.

**Checklist**:
- [ ] Implement Tests screen with Online Daily Quiz and Offline Printable tabs per UX.
- [ ] Wire Online quiz forms to authoring and AI question generation APIs, with `Enforce NO numericals` toggle clearly visible.
- [ ] Wire Offline test config to offline generation and PDF download APIs.

**Estimate**: 3 SP

---

### Task 7.3 — Results & Analytics UI

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Frontend — Analytics

**Notes**:
- **As a** teacher  
- **I want** dashboards for scores, attendance and at-risk students  
- **So that** I can identify who needs extra coaching.  
- **Dependencies**: Task 5.1, 6.1.  
- **Risks**: Data overload if not summarised well.

**Checklist**:
- [ ] Implement Results & Analytics screen with KPIs, charts and “Students needing attention” table per UX.
- [ ] Hook up to analytics APIs; support filters (class, subject, period).

**Estimate**: 2 SP

---

### Task 7.4 — Alerts / Messages UI

**Labels**: Type: Feature | AI: Non-AI | Risk: Low | Area: Teacher Frontend — Notifications

**Notes**:
- **As a** teacher  
- **I want** an Alerts / Messages screen listing absence and test-related notifications  
- **So that** I can review and act on issues.  
- **Dependencies**: Task 5.2, 6.1.  
- **Risks**: None.

**Checklist**:
- [ ] Implement Alerts / Messages screen per UX with list of notifications, filters and read/unread state.
- [ ] Wire to notifications APIs; handle empty/error/offline states.

**Estimate**: 1 SP

---

**Sprint 7 total**: 8 SP

---

## Sprint 8 — Hardening, Observability & AI Guardrails

**Capacity**: 10 SP · Buffer 20% → 8 SP target

---

### Task 8.1 — Teacher service observability (logs, metrics, tracing)

**Labels**: Type: Hardening | AI: Non-AI | Risk: Low | Area: DevOps / Teacher Backend

**Notes**:
- **As a** team  
- **I want** logs, metrics and basic tracing for Teacher backend  
- **So that** we can monitor performance and errors in production.  
- **Dependencies**: Task 1.2.  
- **Risks**: None.

**Checklist**:
- [x] Integrate Teacher backend with platform logging/monitoring stack (e.g. structured logs, metrics endpoints).
- [x] Add health checks and readiness probes for Teacher backend and gateway routes.

**Estimate**: 2 SP | **Status**: Done

---

### Task 8.2 — AI governance & guardrails (teacher domain)

**Labels**: Type: Hardening | AI: AI | Risk: Medium | Area: Teacher Backend — AI Governance

**Notes**:
- **As a** platform owner  
- **I want** guardrails, rate limits and logging for Teacher AI usage  
- **So that** AI behaviour (syllabus ingestion, question generation, solutions) is auditable and aligned with policy.  
- **Dependencies**: Task 3.2, 4.2, 4.3.  
- **Risks**: AI drift if not monitored.

**Checklist**:
- [x] Implement AI call logging (without PII) for Teacher AI endpoints.
- [x] Implement per-teacher and global rate limits for AI-intensive operations.
- [x] Add validation to ensure prompts respect “no numericals” for online quizzes and syllabus alignment.

**Estimate**: 3 SP | **Status**: Done

---

### Task 8.3 — Performance and load validation for Teacher flows

**Labels**: Type: Hardening | AI: Non-AI | Risk: Low | Area: Performance

**Notes**:
- **As a** team  
- **I want** to validate performance under realistic load for attendance, syllabus and tests  
- **So that** Teacher experience remains fast during school peaks.  
- **Dependencies**: Sprints 2–7.  
- **Risks**: None.

**Checklist**:
- [x] Identify critical flows (attendance save, syllabus list, test generation triggers, analytics dashboards).
- [x] Run load tests and capture latency and error rates; add performance budgets.

**Estimate**: 2 SP | **Status**: Done

---

### Task 8.4 — Cross-app integration validation (Student/Parent/Admin)

**Labels**: Type: Hardening | AI: Non-AI | Risk: Medium | Area: Integration

**Notes**:
- **As a** platform  
- **I want** to verify that Teacher APIs support Student, Parent and Admin use cases  
- **So that** the ecosystem behaves consistently end-to-end.  
- **Dependencies**: Task 5.3, Student/Parent/Admin app availability.  
- **Risks**: Cross-app regressions.

**Checklist**:
- [x] Validate Student/Parent attendance and result views against Teacher aggregates.
- [x] Validate Admin dashboards that rely on Teacher data.

**Estimate**: 1 SP | **Status**: Done

---

**Sprint 8 total**: 8 SP

---

## Risk Register (Planner — Teacher App)

| ID | Risk | Mitigation | Owner |
|----|------|------------|--------|
| TR1 | AI hallucination in syllabus concepts / questions | Strict prompts, post-validation, syllabus alignment checks | Teacher Backend + AI Governance |
| TR2 | Numericals leaking into online quizzes | Prompt and validation rules; negative tests; UI toggle enforced server-side | Teacher Backend |
| TR3 | Attendance aggregation correctness | Clear definitions and tests for weekly/monthly aggregates | Teacher Backend |
| TR4 | Cross-app data drift (Teacher vs Student/Parent) | Shared contracts in `@mindforge/shared`; cross-app tests | Backend + Gateway |
| TR5 | AI latency during school peaks | Background workers, pre-generation where possible, user feedback states | Teacher Backend + Frontend |
| TR6 | Notification noise / fatigue | Thresholds and de-duplication in notifications engine | Teacher Backend |

---

## Forecast Summary (Teacher App)

| Sprint | Focus | SP | Confidence |
|--------|--------|-----|------------|
| 1 | Workspace integration & Teacher service foundation | 8 | 95% |
| 2 | Class & Attendance backend | 8 | 95% |
| 3 | Syllabus upload & AI ingestion | 8 | 80% (AI) |
| 4 | Test authoring, generation & evaluation | 10 | 75% (AI) |
| 5 | Analytics, notifications & cross-app APIs | 8 | 90% |
| 6 | Teacher frontend — Dashboard & Classes | 8 | 90% |
| 7 | Teacher frontend — Syllabus, Tests, Analytics, Alerts | 8 | 85% |
| 8 | Hardening, observability & AI guardrails | 8 | 90% |

**Total**: ~66 SP over 8 sprints. **No scope expansion**; all items trace to Teacher Architecture + UX + Workspace docs only.

---

## STANDARD HANDOFF – To Dev Agent (Teacher App)

```
============================================
HANDOFF: Planner / Scrum Master AI Agent → Dev Agent (Teacher App)
============================================

PROJECT: Mindforge Teacher App

ARTIFACT SOURCE: docs/architecture/teacher/Mindforge_Teacher_App_Architecture_v1.md
PLANNING SOURCE: docs/planning/Mindforge_Teacher_App_Planner_Backlog.md

PLANNING STATUS: Backlog and sprints defined for Teacher app; no architecture or UX changes.

WHAT THE DEV RECEIVES:
- Plan: Mindforge Teacher App — Release 1
- Buckets: Sprints 1–8 (Workspace & Teacher service foundation → Class & Attendance backend → Syllabus upload & AI ingestion → Test authoring/generation/evaluation → Analytics & notifications → Teacher frontend Dashboard & Classes → Teacher frontend Syllabus/Tests/Analytics/Alerts → Hardening & AI guardrails)
- Tasks: Each task has Title, User story (As/I want/So that), Acceptance criteria (Checklist), Dependencies, Risks, Labels (Type | AI/Non-AI | Risk | Area)
- Notes: Full details in each task's Notes block
- Capacity: 1 engineer = 8–10 SP/sprint; 20% buffer; AI work treated as probabilistic (forecast confidence per sprint)
- Risk register: TR1–TR6 with mitigations and owner area

CONSTRAINTS (DO NOT BREAK):
- Teacher Architecture v1 is locked (docs/architecture/teacher/Mindforge_Teacher_App_Architecture_v1.md).
- Teacher UX Spec v1 is locked (docs/architecture/teacher/Mindforge_Teacher_App_UX_Design_Specification.md). No screen, flow, or feature changes.
- Workspace architecture is locked (docs/architecture/workspace-architecture.md). Apps remain decoupled; traffic via gateway; shared types in @mindforge/shared.
- No scope expansion; only implement approved design.

DEV NEXT STEPS:
1. Implement in sprint order (Sprint 1 → 2 → … → 8) or as directed by PM; respect dependencies in task Notes.
2. Use Checklist per task as acceptance criteria; satisfy all items before marking done.
3. Surface AI uncertainty (timeouts, fallbacks, alignment checks) in logs and UX states where applicable.
4. Run tests and migrations per CI/CD; adhere to workspace coding standards and security (auth, RBAC, secrets).

BLOCKERS: None.

DEPENDENCIES:
- Reads: docs/architecture/teacher/Mindforge_Teacher_App_Architecture_v1.md
- Reads: docs/architecture/teacher/Mindforge_Teacher_App_UX_Design_Specification.md
- Reads: docs/architecture/workspace-architecture.md

============================================
Signature: Planner / Scrum Master AI Agent – Mindforge Teacher App
============================================
```
