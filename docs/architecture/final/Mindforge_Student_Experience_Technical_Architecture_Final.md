# Mindforge Student Experience -- Technical Architecture (v3 -- Teacher-Grounded AI System)

**Artifact name**: Mindforge_Student_Experience_Technical_Architecture_Final  
**Suggested file path**: docs/architecture/final/Mindforge_Student_Experience_Technical_Architecture_Final.md  
**Project**: Mindforge Student Experience  
**Date**: February 20, 2026  
**Mode**: Architect AI Agent (Final Mode)

**Constraints locked**:
- Light Architecture: `docs/Mindforge_Student_Experience_Light_Architecture_v2.md` (v3 -- Teacher-Grounded Closed AI)
- UX Specification (Approved): `docs/Mindforge_Student_Experience_UX_Design_Specification.md` -- **no UX or feature changes**.

---

## 1. Activated Modes Summary

| Mode | Trigger | Application |
|------|---------|-------------|
| **Strategy & Discovery** | Multi-platform (Android, iOS, desktop), single backend, sync requirements | Architecture boundaries and component ownership defined; no scope creep. |
| **Governance & Architecture Lock** | UX approved; downstream planning/development depends on this artifact | This document is the technical contract; no feature additions. |
| **AI-First / Cloud-Native** | AI roles (Homework Generator, Quiz Engine, Doubt Solver, Gap-Bridge), Teacher-Grounded Closed AI, India single-region deployment | AI components, cost tiers, teacher content pipeline, and cloud deployment assumptions documented. |
| **Security-by-Design** | PII (students, minors), 6-digit MPIN, educational records, attendance data, teacher IP | AuthN/AuthZ, data protection, teacher material access control, and threat mitigations defined. |

---

## 2. Assumptions & Constraints

### Assumptions
- **Identity provisioning**: Account creation (e.g. phone/identifier binding) is done by a separate provisioning flow; this architecture consumes "student identity" and **MPIN verification** only.
- **Teacher content**: Teachers upload study material (PDFs, notes, worksheets) via a dedicated upload API. Material is processed into chunks with embeddings and stored in vector storage. This replaces the previous NotebookLM dependency entirely.
- **No external knowledge**: The AI system is a strict closed-domain system. It answers exclusively from teacher-uploaded material. No external feeds, no general LLM knowledge, no internet content.
- **Attendance source**: Attendance records (present/absent per day) are available to the backend (source TBD); student-facing UX is read-only; no self-correction of attendance in scope.
- **Single region**: Initial deployment is India-focused; multi-region not required in this phase.
- **No full offline**: Partial caching and queued actions; no full offline app experience in v1.
- **Scale (light)**: Single-region, moderate user growth; no global multi-region consistency design.

### Constraints (from Light Architecture + UX)
- **UX locked**: Screens, navigation (Home, Attendance, Doubts, Profile), flows, and states are as per UX spec -- no changes.
- **6-digit MPIN only** for student login; rate limiting and lockout mandatory.
- **AI behavior**: Progressive guidance (Hints -> Approach -> Concept -> Solution); no direct answers by default; teacher-material-only content; fail closed with "Not found in provided material." when retrieval fails.
- **Platforms**: Android app, iOS app, desktop browser; shared backend and data model; sync across devices.
- **Low bandwidth**: Small payloads, lazy-load AI/rich media, usable on unstable 3G.
- **Data sensitivity**: PII and educational/attendance data; encryption in transit (HTTPS); encryption at rest recommended; minimal PII to AI providers (pseudonymous IDs). Teacher material is intellectual property; access control enforced per class.

---

## 3. High-Level Architecture

### 3.1 Components

| Layer | Component | Description |
|-------|-----------|-------------|
| **Client** | **UI / Navigational layer** | Android app, iOS app, Web app. Handles routes/screens (Login, Home, Activity, Results, Attendance, Doubts, Profile), bottom nav/sidebar, and all UX states per spec. |
| **Client** | **API client / sync** | Calls backend APIs; handles auth (MPIN-derived token); optional local queue for offline actions and sync state. |
| **Backend** | **API / Gateway layer** | REST API; request validation; auth (token/session); rate limiting; routing to business layer. |
| **Backend** | **Business logic layer (middle layer)** | Application services: auth (MPIN verify, lockout), today's plan, activity lifecycle, grading rules, **teacher content ingestion**, **retrieval (vector search)**, **AI orchestration**, **response validation**, attendance aggregation, doubt context. No direct DB access. |
| **Backend** | **Data access layer (database interaction layer)** | Repositories/DAOs: CRUD and queries for students, activities, questions, responses, attendance, syllabus, AI logs, **teacher materials**, **embeddings**, **AI usage logs**. Abstracts DB. |
| **Backend** | **Database** | Persistent store for users, syllabus, content, attempts, attendance, sessions, **teacher_materials**, **teacher_material_chunks** (with embedding vectors), **ai_usage_logs**. |
| **External** | **AI provider(s)** | Stateless LLM generation/evaluation; no persistent student data on provider side. |
| **External** | **Embedding model** | Stateless embedding generation for teacher material chunks. May be same provider or dedicated API. |
| **Infrastructure** | **Cloud object storage** | Secure storage for raw teacher-uploaded files (PDFs, notes). |

### 3.2 Responsibilities

- **UI / Navigational layer**: Render screens per UX spec; manage navigation (e.g. `/login`, `/home`, `/activity/:type/:id`, `/results/:type/:id`, `/attendance`, `/doubts`, `/profile`); handle loading/error/empty/offline states; collect user input and call API client.
- **API layer**: Validate input; authenticate requests; enforce rate limits; delegate to business layer; return consistent JSON and HTTP status codes.
- **Business logic layer**: Implement use cases (login, today's plan, start/submit activity, evaluate answer, **ingest teacher content**, **retrieve relevant chunks via vector search**, **orchestrate AI with retrieved context**, **validate AI response for citation and confidence**, attendance summary, doubt with syllabus context); enforce pedagogical and business rules; call data access layer and external services (AI, embedding model).
- **Data access layer**: Execute all DB reads/writes; map domain objects to/from DB schema; ensure queries are efficient and scoped by student/tenant where applicable.
- **Database**: Persist students, syllabus (class/subject/chapter/topic), activities (homework/quiz/test), questions, responses, grades, attendance, doubt threads, sessions, audit data, **teacher_materials**, **teacher_material_chunks** (with embeddings), **ai_usage_logs**.

### 3.3 Communication Patterns

- **Client <-> Backend**: REST over HTTPS; JSON request/response; Bearer token (or session cookie) after MPIN login.
- **API layer -> Business layer**: In-process calls (e.g. service interfaces); DTOs or domain objects.
- **Business layer -> Data access layer**: In-process calls (repositories); domain or DTOs.
- **Business layer -> AI**: Outbound HTTP to AI provider(s); prompts include only retrieved teacher material chunks and syllabus context (pseudonymous IDs); responses validated for citation and then persisted via data access layer.
- **Business layer -> Embedding model**: Outbound HTTP for generating embeddings during teacher content ingestion.
- **Sync**: Client polls or uses short-polling/SSE for "today's plan" and activity state; conflict resolution (e.g. "newer progress on another device") handled in business layer and exposed via API.

---

## 4. Technology Stack

| Area | Choices | Rationale |
|------|---------|-----------|
| **Frontend** | Cross-platform: React Native (or Flutter) for Android/iOS; React (or Next.js) for web. Shared UX spec and API contract. | Single team can maintain one UX spec across three surfaces; reuse of logic and API client. |
| **Backend** | Stateless API service (e.g. Node.js/Express, or Java/Spring Boot, or Go). | Fits single-region, horizontal scaling; clear separation of API, business, and data layers. |
| **Data** | Primary DB: PostgreSQL with **pgvector extension** for vector similarity search. Optional cache: Redis (sessions, rate limits, optional response cache). | Relational model fits students, syllabus, activities, attendance; pgvector enables teacher material chunk retrieval without a separate vector DB. |
| **Cloud & DevOps** | Single region (e.g. AWS/GCP in India). API behind load balancer; containers (e.g. Docker/Kubernetes or managed app runtime). DB managed (RDS/Cloud SQL). Secrets in vault. **Cloud object storage** (S3/GCS) for teacher material files. | Aligns with India-focused, single-region assumption. |
| **AI** | LLM/GenAI via provider API (e.g. OpenAI-compatible or Google). Embedding model for vector generation. Structured evaluation for MCQs where possible. | Stateless AI; cost control via tiering (cheap for grading, higher for doubt/concept). Embedding one-time per upload. |

---

## 5. API & Data Model Overview

### 5.1 Database (High-Level)

- **students**: identity (id, external_id for provisioning), class, board, school, display_name; no password; MPIN hash (or equivalent) for verification; consent flags.
- **syllabus_metadata**: class, board, subject, chapter, topic (normalized hierarchy).
- **teacher_materials**: id, teacher_id, class, subject, file_name, file_type, storage_path, status (processing/ready/failed), uploaded_at.
- **teacher_material_chunks**: id, material_id (FK to teacher_materials), chunk_text, chunk_index, embedding_vector (pgvector), syllabus_ref (class, subject, chapter, topic), created_at.
- **activities**: homework/quiz/test instances (student_id, type, syllabus ref, status, created_at, due_at).
- **questions**: question bank (syllabus ref, type, content, correct answer / rubric, source_chunk_id optional FK to teacher_material_chunks); linked to activities.
- **responses**: student_id, question_id, activity_id, attempt payload, score, feedback_level, ai_conversation_ref, cited_chunk_ids (array of chunk IDs used in AI response).
- **attendance**: student_id, date, status (present/absent), source_label; optionally period/term.
- **doubt_threads**: student_id, syllabus context (class, subject, chapter, topic), messages (role, content, cited_chunk_ids), created_at.
- **sessions**: student_id, token_or_session_id, device_info, created_at, expires_at; used for auth and optional lockout.
- **audit_log**: sensitive operations (login attempts, lockouts, data access) for security and compliance.
- **ai_usage_logs**: student_id, feature_type (homework_gen/quiz_gen/doubt/feedback/grading), model_used, tokens_used (prompt + completion), latency_ms, retrieval_chunk_count, timestamp.

Indexes and constraints: by student_id, activity_id, material_id, date (attendance), syllabus keys, and embedding_vector (pgvector index for similarity search) for fast lookups.

### 5.2 API Endpoints (to interact with database via business + data layers)

All below are **logical**; actual paths and HTTP verbs follow REST conventions. Auth required except where noted.

| Domain | Method | Path (logical) | Purpose | Layer flow |
|--------|--------|----------------|---------|-------------|
| **Auth** | POST | `/auth/mpin/verify` | Verify MPIN; return token/session; apply rate limit and lockout | API -> Business (auth service) -> Data (sessions, students) |
| **Auth** | POST | `/auth/lockout/status` | Check lockout state (e.g. after failed attempts) | API -> Business -> Data |
| **Auth** | POST | `/auth/forgot-mpin` | Initiate MPIN recovery (e.g. send OTP to registered contact) | API -> Business -> Data / external |
| **Today's plan** | GET | `/student/today` | Today's tasks (homework, quiz, gaps), progress summary | API -> Business -> Data (activities, responses, attendance) |
| **Activities** | GET | `/student/activities/:type/:id` | Get activity + questions (e.g. for Activity screen) | API -> Business -> Data |
| **Activities** | POST | `/student/activities/:type/:id/respond` | Submit answer; evaluate; optionally request AI feedback | API -> Business -> Data + AI -> Data |
| **Activities** | GET | `/student/activities/:type/:id/feedback` | Get AI feedback (next level) for current question | API -> Business -> Retrieval -> AI + Data |
| **Activities** | POST | `/student/activities/:type/:id/pause` | Save progress and pause (e.g. exit mid-activity) | API -> Business -> Data |
| **Results** | GET | `/student/results/:type/:id` | Get activity result (score, breakdown, next suggestions) | API -> Business -> Data |
| **Attendance** | GET | `/student/attendance` | Summary + calendar (present/absent by day); query params: period | API -> Business -> Data (attendance) |
| **Doubts** | GET | `/student/doubts` | List threads or current thread | API -> Business -> Data |
| **Doubts** | POST | `/student/doubts` | Create message with syllabus context (class, subject, chapter, topic) | API -> Business -> Retrieval -> AI + Data |
| **Doubts** | GET | `/student/doubts/:threadId` | Get thread messages | API -> Business -> Data |
| **Syllabus** | GET | `/student/syllabus/tree` | Class -> Subject -> Chapter -> Topic (for Doubts context selector) | API -> Business -> Data |
| **Profile** | GET | `/student/profile` | Display name, class, board, progress overview | API -> Business -> Data |
| **Sync** | GET | `/student/sync/status` | Last sync timestamp; conflict hint if any | API -> Business -> Data |

Implementations **must** use the **middle layer** for all business rules (e.g. grading, lockout, AI level, retrieval, response validation); the **data access layer** is the only layer that talks to the database.

### 5.3 Data Flow (example: student asks a doubt)

1. Client: `POST /student/doubts` with `{ message, syllabusClass, syllabusSubject, syllabusChapter, syllabusTopic }`.
2. API layer: Validate body, check auth, rate limit -> call business layer (DoubtService).
3. Business layer (DoubtService):
   a. Call **RetrievalService**: perform vector similarity search on `teacher_material_chunks` where class/subject/chapter match the syllabus context. Return top-K chunks with similarity scores.
   b. **Confidence check**: If best chunk similarity score is below threshold, skip AI call and return "Not found in provided material."
   c. Call **AiOrchestratorService**: build prompt with retrieved chunks as context, system prompt enforcing retrieval-only answering, student question. Call AI provider.
   d. Call **ResponseValidatorService**: check AI response contains valid chunk citation(s); check response is on-topic; reject if citation missing or off-topic.
   e. If valid: persist doubt message and AI response (with cited_chunk_ids) via data access layer.
   f. If invalid: return "Not found in provided material." and log rejection in ai_usage_logs.
4. Data access layer: Run DB reads/writes (doubt_threads, doubt_messages, ai_usage_logs).
5. API layer: Return 200 + response (AI answer with citation, or "Not found in provided material.").

### 5.4 Data Flow (example: teacher uploads material)

1. Teacher upload endpoint receives file (PDF/notes) with metadata (teacher_id, class, subject).
2. API layer: Validate file type/size, check auth (teacher role), rate limit -> call business layer.
3. Business layer (TeacherContentService):
   a. Store raw file in cloud object storage; record in `teacher_materials` table with status=processing.
   b. Parse file (PDF text extraction).
   c. Split text into semantic chunks (~500 tokens with overlap).
   d. For each chunk: generate embedding via embedding model API; store chunk text + embedding in `teacher_material_chunks` with syllabus_ref.
   e. Update `teacher_materials` status to ready.
4. On failure at any step: mark status=failed; log error; allow retry.

---

## 6. Module Structure (inside /modules/activities)

### 6.1 New Services

| Service | Responsibility |
|---------|---------------|
| **teacher-content.service** | Handles teacher material upload, file validation, PDF parsing, text chunking, embedding generation orchestration, and material status lifecycle. |
| **retrieval.service** | Performs vector similarity search over `teacher_material_chunks` scoped by class/subject/chapter. Returns top-K chunks with confidence scores. Enforces access control (student's class teacher material only). |
| **ai-orchestrator.service** | Builds retrieval-augmented prompts (system prompt + retrieved chunks + student question). Calls AI provider. Enforces strict retrieval-only prompting rules (low temperature, no general knowledge instruction). |
| **response-validator.service** | Validates AI responses: checks for valid chunk citation(s), checks on-topic alignment, rejects responses without citation. Returns validated response or triggers "Not found in provided material." |

### 6.2 New Repositories

| Repository | Responsibility |
|------------|---------------|
| **teacher-content.repository** | CRUD for `teacher_materials` table. Query by teacher_id, class, subject, status. |
| **embeddings.repository** | CRUD for `teacher_material_chunks` table. Vector similarity search (pgvector). Query by material_id, syllabus_ref. Scoped by class/teacher. |
| **ai-usage.repository** | Insert and query `ai_usage_logs`. Aggregations for monitoring (tokens used per student, per feature, per day). |

### 6.3 Module Boundaries

- These services and repositories live inside `/modules/activities` as they extend the activities domain (AI-powered homework, quiz, doubt, gap-bridge all flow through teacher content retrieval).
- **No cross-module DB access**: Only the activities module repositories access `teacher_materials`, `teacher_material_chunks`, and `ai_usage_logs` tables.
- Controllers remain HTTP-only (no business logic).
- Services contain business logic only (no DB queries).
- Repositories contain DB interaction only (no business rules).

---

## 7. AI Architecture & Governance

### 7.1 Closed-Domain AI Rules (Non-Negotiable)

| Rule | Enforcement |
|------|-------------|
| **Retrieval-only answering** | System prompt explicitly instructs: "Answer ONLY from the provided context. Do not use your training data or general knowledge." |
| **No free-form answering** | AI prompt always includes retrieved teacher material chunks as the sole context. No open-ended generation without context. |
| **No outside knowledge** | System prompt includes: "If the answer is not in the provided context, respond exactly: Not found in provided material." |
| **Low temperature** | Temperature set to 0.1-0.2 for all calls. No creative or speculative responses. |
| **Citation required** | AI must cite the chunk_id(s) used. ResponseValidatorService rejects any response without valid citation. |
| **Reject on missing citation** | If the AI response does not include a parseable chunk citation, the response is discarded and "Not found in provided material." is returned. |
| **Confidence threshold** | RetrievalService checks similarity scores. If best match is below threshold (configurable, e.g. 0.7 cosine similarity), AI is not called; "Not found in provided material." returned directly. |
| **Fail closed** | On any error (AI timeout, retrieval failure, validation failure), the system returns "Not found in provided material." -- never a hallucinated or ungrounded answer. |

### 7.2 Model Strategy

- Use LLM for doubt solving, conceptual explanations, and adaptive feedback -- all grounded in retrieved teacher material.
- Prefer deterministic or cheaper structured evaluation for MCQs and simple grading.
- **Data flow**: Prompts include retrieved teacher material chunks and syllabus context (class, subject, chapter, topic); no raw PII; pseudonymous IDs. Responses validated (citation check, on-topic check) before storage and display.
- **Cost & drift**: High-frequency simple checks use cheaper/smaller models or rules; expensive calls for doubt/concept; monitor token usage via `ai_usage_logs` and set caps; periodic review of AI outputs for accuracy drift and over-helping (Light Architecture R1, R2).

### 7.3 Prompt Structure

```
SYSTEM PROMPT:
You are a study assistant for Class {class}, Subject {subject}.
You must answer ONLY using the provided study material excerpts below.
Do NOT use your own training data or general knowledge.
If the answer is not found in the provided material, respond exactly:
"Not found in provided material."

For each statement you make, cite the source using [chunk:{chunk_id}] format.
If you cannot cite a source, do not make the statement.

RETRIEVED CONTEXT:
[chunk:{id_1}] {chunk_text_1}
[chunk:{id_2}] {chunk_text_2}
...

STUDENT QUESTION:
{student_question}
```

---

## 8. Error Handling Strategy

- **API layer**: Consistent error response shape: `{ code, message, details? }`; HTTP status (4xx/5xx) per case; validation errors 400; auth 401; forbidden 403; not found 404; rate limit 429; server errors 500.
- **Business layer**: Domain exceptions (e.g. InvalidMPIN, LockedOut, ActivityNotFound, MaterialNotFound, RetrievalBelowThreshold); map to API codes and messages; never expose internal stack to client.
- **Data layer**: Transient DB errors -> retry with backoff; duplicate/key errors -> mapped to 409 or domain message; connection failures -> 503 or retry.
- **AI**: Timeout (e.g. 10s) -> return "Not found in provided material." (fail closed); provider error -> same fail-closed response; no raw AI errors to client.
- **Retrieval**: Vector search failure or empty results -> "Not found in provided material." with appropriate logging.
- **Teacher content ingestion**: Parse/chunk/embed failures -> mark material status=failed; allow teacher retry; do not surface partial chunks.
- **Client (per UX)**: Inline validation; network errors with retry and "Save offline" where specified; AI failure with "Try Again"; session timeout modal; sync conflict modal ("Use latest?" / "Keep current").
- **Logging**: Log errors with request id and no PII; audit security events (failed logins, lockouts); log AI usage (tokens, latency, retrieval counts) to ai_usage_logs.

---

## 9. Deployment Assumptions

- **Single region**: India (e.g. ap-south-1 or equivalent); no multi-region DB or active-active in this phase.
- **API**: Deployed behind HTTPS load balancer; horizontal scaling of stateless API instances.
- **Database**: Managed RDBMS (e.g. RDS/Cloud SQL) with **pgvector extension** enabled; automated backups; encryption at rest; access only from API/backend network.
- **Cloud object storage**: S3 bucket (or GCS) for teacher-uploaded files; server-side encryption; access via signed URLs or backend-only access; no direct student access to raw files.
- **Embedding worker**: Teacher content processing (parse, chunk, embed) runs as an async job/worker to avoid blocking the upload request. Can be a queue-driven worker or background job within the API service.
- **Secrets**: API keys, DB credentials, AI keys, embedding API keys in vault (e.g. AWS Secrets Manager / GCP Secret Manager); no secrets in code or client.
- **CI/CD**: Build and test on commit; deploy to staging then production via pipeline; DB migrations versioned and applied in deploy.
- **Monitoring**: Health checks, latency and error metrics, alerting on 5xx and auth failures. **AI-specific monitoring**: token usage per day/student, retrieval hit rate, "Not found" response rate, average retrieval confidence score.
- **Clients**: Android/iOS via app stores; Web via CDN or same origin as API (CORS configured).

---

## 10. Security Architecture

- **AuthN**: 6-digit MPIN verified by backend; on success issue short-lived token (or session); token sent as Bearer (or cookie). No MPIN in logs or client storage beyond secure entry.
- **AuthZ**: All student endpoints scoped by authenticated student_id; no cross-student access; role `student` only in this scope. Teacher material access scoped by student's enrolled class and teacher(s).
- **Data protection**: HTTPS only; PII and educational data encrypted at rest; DB access only from data access layer with least privilege; minimal PII in AI prompts (pseudonymous IDs). Teacher material files encrypted at rest in cloud storage.
- **File validation**: Teacher uploads validated for file type (PDF, DOCX, TXT only), file size limits, and malware scanning before processing.
- **Threat mitigations**: Rate limiting and lockout on MPIN (per Light Architecture R7); input validation and parameterized queries to prevent injection; audit log for sensitive actions; dependency scanning in CI.
- **Teacher material access control**: Retrieval service enforces that vector search is scoped to material uploaded by the student's assigned teacher(s) and class. No cross-class material access at repository level.

---

## 11. Key Technical Decisions & Trade-offs

| Decision | Trade-off |
|----------|-----------|
| **Three-tier backend (API -> Business -> Data)** | Clear separation and testability vs. extra hops; chosen for maintainability and safe evolution. |
| **Single DB (PostgreSQL) with pgvector** | Simplicity and ACID for activities/attendance + vector search in same DB vs. eventual need for dedicated vector DB if scale grows; acceptable for single-region moderate scale. |
| **REST over HTTPS** | Wide client support and simplicity vs. no built-in real-time; acceptable for poll/SSE-based sync. |
| **MPIN-only auth** | UX simplicity for students vs. weaker security; mitigated by rate limit, lockout, and optional biometric layer. |
| **AI stateless + retrieval-augmented** | No student data at provider; grounded answers from teacher material vs. latency of retrieval + LLM call; mitigated by caching and pre-generation. |
| **Teacher-grounded closed AI (no external knowledge)** | Strict accuracy and trust vs. inability to answer beyond uploaded material; by design -- "Not found" is preferred over hallucination. |
| **Attendance read-only for student** | Trust and consistency vs. no self-service correction; aligns with Light Architecture. |
| **pgvector in PostgreSQL vs. dedicated vector DB** | Operational simplicity (one DB) vs. potential performance ceiling; pgvector sufficient for anticipated scale; migration path to dedicated vector DB exists if needed. |

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| **R1: AI hallucination / off-topic** | Retrieval-only prompting; citation-required validation; fail closed on missing citation; "Not found in provided material." |
| **R2: Over-helping** | Enforce guidance levels in business layer; "full solution" gated; UX reflects help level. |
| **R3: Grading fairness** | Deterministic scoring for objective items; clear explanations and rubric storage. |
| **R4: Data privacy (minors)** | Minimize PII to AI; consent flows; encryption; deletion/anonymization path. |
| **R5: Teacher material quality** | "Not found" response by design; surface coverage metrics to teachers; no fabricated answers. |
| **R6: Connectivity / latency** | Pre-generate/cache where possible; retry and clear offline/sync states in UI. |
| **R7: MPIN brute-force** | Rate limiting, lockout, optional device/biometric layer; audit failed attempts. |
| **R8: Attendance accuracy** | Read-only for student; label period/source; conflict handling in final integration. |
| **R9: Teacher material access control** | Retrieval scoped by class/teacher; enforced at repository layer; no cross-class access. |

---

## 13. System Architecture Diagram (v3 -- Teacher-Grounded AI)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                       MINDFORGE STUDENT EXPERIENCE                          │
│              Architecture v3 -- Teacher-Grounded AI System                  │
│                          Execution-ready.                                   │
└──────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
  │   ANDROID APP    │  │    iOS APP       │  │   DESKTOP WEB    │
  │  (UI + Nav +     │  │  (UI + Nav +     │  │  (UI + Nav +     │
  │   API Client)    │  │   API Client)    │  │   API Client)    │
  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
           │                     │                     │
           │    HTTPS / REST     │                     │
           └─────────────────────┼─────────────────────┘
                                 │
                                 v
  ┌──────────────────────────────────────────────────────────────────────────┐
  │                           API LAYER (Gateway)                            │
  │  Auth · Rate limit · Validation · Route to Business Layer                │
  └──────────────────────────────────────────────────────────────────────────┘
                                 │
                                 v
  ┌──────────────────────────────────────────────────────────────────────────┐
  │                    BUSINESS LOGIC LAYER (Middle Layer)                    │
  │  Auth · Today's plan · Activities · Grading · Attendance · Doubts       │
  │                                                                          │
  │  TEACHER-GROUNDED AI PIPELINE (/modules/activities):                    │
  │  ┌─────────────────────────────────────────────────────────────────┐    │
  │  │                                                                 │    │
  │  │  Teacher Upload                                                 │    │
  │  │       │                                                         │    │
  │  │       v                                                         │    │
  │  │  ┌─────────────┐     ┌──────────────┐     ┌────────────────┐   │    │
  │  │  │ Teacher      │     │ Content      │     │ Embedding      │   │    │
  │  │  │ Content Svc  │ --> │ Processing   │ --> │ Generation     │   │    │
  │  │  │ (upload,     │     │ (PDF parse,  │     │ (vector embed) │   │    │
  │  │  │  validate)   │     │  chunk)      │     │                │   │    │
  │  │  └─────────────┘     └──────────────┘     └───────┬────────┘   │    │
  │  │                                                    │            │    │
  │  │                                          ┌─────────v────────┐  │    │
  │  │                                          │ Vector Storage   │  │    │
  │  │                                          │ (pgvector)       │  │    │
  │  │                                          └─────────┬────────┘  │    │
  │  │                                                    │            │    │
  │  │  Student Question                                  │            │    │
  │  │       │                                            │            │    │
  │  │       v                                            │            │    │
  │  │  ┌──────────────┐     ┌────────────────┐          │            │    │
  │  │  │ Retrieval    │ <---│ Vector Search  │ <--------┘            │    │
  │  │  │ Service      │     │ (top-K chunks) │                       │    │
  │  │  └──────┬───────┘     └────────────────┘                       │    │
  │  │         │                                                       │    │
  │  │         v                                                       │    │
  │  │  ┌────────────────┐                                            │    │
  │  │  │ AI Orchestrator│ -- prompt with retrieved chunks -->        │    │
  │  │  │ Service        │                                  │         │    │
  │  │  └──────┬─────────┘                                  │         │    │
  │  │         │                                            │         │    │
  │  │         v                                            v         │    │
  │  │  ┌───────────────┐                      ┌──────────────────┐  │    │
  │  │  │ Response      │                      │  AI Provider     │  │    │
  │  │  │ Validator     │ <--- AI response --- │  (external LLM)  │  │    │
  │  │  │ (citation     │                      └──────────────────┘  │    │
  │  │  │  check, fail  │                                            │    │
  │  │  │  closed)      │                                            │    │
  │  │  └──────┬────────┘                                            │    │
  │  │         │                                                      │    │
  │  │    valid? ─── NO ──> "Not found in provided material."        │    │
  │  │         │                                                      │    │
  │  │        YES                                                     │    │
  │  │         │                                                      │    │
  │  │         v                                                      │    │
  │  │  Return grounded response with chunk citation                  │    │
  │  │                                                                 │    │
  │  └─────────────────────────────────────────────────────────────────┘    │
  │                                                                          │
  │  Sync/conflict · No direct DB access                                    │
  └──────────────┬───────────────────────────────────────┬──────────────────┘
                 │                                       │
                 │                                       │ HTTP
                 v                                       v
  ┌──────────────────────────────┐    ┌──────────────────────────────────────┐
  │  DATA ACCESS LAYER           │    │  EXTERNAL                            │
  │  (DB interaction only)       │    │  · AI provider (stateless LLM)      │
  │  Repositories / DAOs         │    │  · Embedding model (stateless)      │
  │                              │    │                                      │
  │  Existing:                   │    │  NO external knowledge services.    │
  │  · student.repository        │    │  NO NotebookLM.                     │
  │  · activity.repository       │    └──────────────────────────────────────┘
  │  · question.repository       │
  │  · response.repository       │
  │  · attendance.repository     │
  │  · doubt.repository          │
  │  · session.repository        │
  │  · audit-log.repository      │
  │  · syllabus.repository       │
  │                              │
  │  New (v3):                   │
  │  · teacher-content.repo      │
  │  · embeddings.repo           │
  │  · ai-usage.repo             │
  └──────────────┬───────────────┘
                 │
                 v
  ┌──────────────────────────────┐    ┌──────────────────────────────────────┐
  │  DATABASE                    │    │  CLOUD OBJECT STORAGE                │
  │  PostgreSQL + pgvector       │    │  Teacher material files (PDFs, etc) │
  │                              │    │  Encrypted at rest                   │
  │  Existing tables:            │    │  Access: backend-only               │
  │  · students                  │    └──────────────────────────────────────┘
  │  · syllabus_metadata         │
  │  · activities                │    ┌──────────────────────────────────────┐
  │  · questions                 │    │  REDIS (optional)                    │
  │  · responses                 │    │  Sessions · Rate limits · Cache      │
  │  · attendance                │    └──────────────────────────────────────┘
  │  · doubt_threads             │
  │  · sessions                  │
  │  · audit_log                 │
  │                              │
  │  New tables (v3):            │
  │  · teacher_materials         │
  │  · teacher_material_chunks   │
  │    (with pgvector embeddings)│
  │  · ai_usage_logs             │
  │                              │
  │  Removed (v3):               │
  │  · teaching_feed (deleted)   │
  └──────────────────────────────┘

  NAVIGATION (UI LAYER):  Login -> Home -> Activity | Attendance | Doubts | Profile
                          Activity -> Results -> Home
  UX LOCKED: No change to screens, flows, or features per approved UX spec.
```

---

## 14. Approval Decision

**Architecture Approved -- downstream work may proceed.**

This technical architecture (v3 -- Teacher-Grounded AI System) is execution-ready and respects the Light Architecture v3 and the approved UX Specification. The NotebookLM dependency has been fully replaced by the teacher content ingestion and retrieval pipeline. Frontend (UI/navigational layer), backend (API, business logic with new teacher-grounded AI services, data access with new repositories), database (existing tables preserved, new tables added, teaching_feed removed), API endpoints (unchanged contracts), error handling, deployment assumptions, and risks are defined. No UX or feature additions are introduced.

**Confirmation**:
- Modular rules preserved: Controllers = HTTP only, Services = business logic only, Repositories = DB only, no cross-module DB access.
- Security baseline preserved: AuthN/AuthZ unchanged, encryption unchanged, rate limiting unchanged, audit logging unchanged. Teacher material access control added.
- API contracts unchanged: All existing endpoints remain identical. No new student-facing endpoints added.

---

## 15. Artifacts to Save

- **Primary**: `docs/architecture/final/Mindforge_Student_Experience_Technical_Architecture_Final.md`
- **Export**: `docs/architecture/final/Mindforge_Student_Experience_Technical_Architecture_Final.html`

---

## STANDARD HANDOFF -- To Planner Agent

```
============================================
HANDOFF: Architect AI Agent (Final Mode) -> Planner Agent
============================================

PROJECT: Mindforge Student Experience

ARTIFACT SOURCE: docs/architecture/final/Mindforge_Student_Experience_Technical_Architecture_Final.md

ARCHITECTURE STATUS: Approved (v3 -- Teacher-Grounded AI System) -- downstream work may proceed.

WHAT THE PLANNER RECEIVES:
- Frontend: UI / Navigational layer (Android, iOS, Web) with routes/screens per UX spec; API client and sync handling. UNCHANGED.
- Backend: Three-tier -- API layer, Business logic layer (middle layer) with NEW teacher-grounded AI services (teacher-content.service, retrieval.service, ai-orchestrator.service, response-validator.service), Data access layer with NEW repositories (teacher-content.repository, embeddings.repository, ai-usage.repository). No direct DB access from business layer.
- Database: Relational (PostgreSQL + pgvector); existing tables preserved; NEW tables: teacher_materials, teacher_material_chunks, ai_usage_logs; REMOVED: teaching_feed.
- API endpoints: UNCHANGED. Auth (MPIN verify, lockout, forgot-mpin); student today, activities (get, respond, feedback, pause), results, attendance, doubts, syllabus tree, profile, sync status. All go through API -> Business -> Data.
- AI Governance: Strict retrieval-only prompting; citation required; fail closed; no external knowledge.
- Error handling: Consistent API error shape; domain exceptions in business layer; AI fails closed; client-side patterns per UX.
- Deployment: Single region (India), HTTPS, managed DB with pgvector, cloud object storage for teacher files, embedding worker, secrets in vault, CI/CD, monitoring with AI usage metrics.
- Risks and trade-offs: Documented with mitigations (teacher material quality replaces NotebookLM feed quality risk).

CONSTRAINTS (DO NOT BREAK):
- UX is locked (docs/Mindforge_Student_Experience_UX_Design_Specification.md). No screen, flow, or feature changes.
- Light Architecture v3 is the product/constraint source (teacher-grounded AI, 6-digit MPIN, multi-platform sync, attendance + calendar, AI behavior, data sensitivity).
- Modular structure: Controllers = HTTP only, Services = business logic only, Repositories = DB only. No cross-module DB access.

PLANNER NEXT STEPS:
1. Consume this technical architecture and the UX spec to produce execution plan (phases, sprints, or work streams).
2. Sprint 8 must be updated to: Teacher-Grounded AI Integration (replacing NotebookLM).
3. Do not add features or change UX; only plan implementation of the approved design.

BLOCKERS: None.

DEPENDENCIES:
- Reads: docs/Mindforge_Student_Experience_Light_Architecture_v2.md (v3)
- Reads: docs/Mindforge_Student_Experience_UX_Design_Specification.md

============================================
Signature: Architect AI Agent (Final Mode, v3) -- Mindforge Student Experience
============================================
```
