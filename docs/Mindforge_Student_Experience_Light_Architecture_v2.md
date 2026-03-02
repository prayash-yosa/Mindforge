# Mindforge Student Experience -- Light Architecture (v3)

**Artifact name**: Mindforge_Student_Experience_Light_Architecture_v3  
**Suggested file path**: docs/architecture/light/Mindforge_Student_Experience_Light_Architecture_v3.md  

**Project Name**: Mindforge Student Experience  
**Idea Source**: docs/Mindforge_Student_Experience.pdf (Student experience definition for Class 6-12, ICSE/CBSE/State Board)

> This v3 artifact updates v2 with:
> - **Removal of NotebookLM dependency**. The system no longer relies on any external knowledge service for content.
> - **Teacher-Grounded Closed AI model**: All AI responses are sourced exclusively from teacher-uploaded material (PDFs, notes). If the answer is not found, the system responds: *"Not found in provided material."*
> - **Teacher Content Ingestion Flow**: Teachers upload study material -> content is chunked -> embeddings generated -> stored in vector storage -> retrieved at query time.
> - **Strict closed-domain AI governance**: No external knowledge, no hallucination, no general internet answers.
>
> Previous v2 changes preserved:
> - A **6-digit MPIN-only login** model.  
> - Explicit **multi-platform support**: Android app, iOS app, and desktop browser, all kept in sync.
> - **Attendance with calendar integration**: students see how many days they are present and absent, surfaced via an integrated calendar view.

---

## 1. Platform constraints

### Primary form factors

- **Android app**: First-class native or hybrid app experience for Android phones (low- to mid-range devices, intermittent connectivity).
- **iOS app**: Equivalent experience for iPhones, functionally on par with Android.
- **Desktop browser**: Modern desktop browsers (Chrome/Edge/Safari) with responsive layouts.

All three platforms **share a common backend and data model**, so:

- Homework, quizzes, tests, progress, gaps, and **attendance** **stay in sync** across Android, iOS, and desktop.
- A student can start on one device and continue on another with no manual migration.
- **Attendance** is visible per day (present/absent) and is integrated with a **calendar** view so students can see how many days they were present or absent over a period.

### Access pattern

- Individual student accounts with login using a **6-digit MPIN only** (see AI & security constraints below).
- Parent/guardian and teacher/institute views remain out-of-scope for this iteration unless explicitly added later.

### Performance & connectivity

- Optimize for **low bandwidth**, especially on mobile:
  - Keep app bundles and API responses small.
  - Lazy-load heavy AI interactions and rich media.
- Core navigation and progress views must remain **usable on unstable 3G**.
- AI calls can be deferred/queued with clear UI states and retry options.

### Time horizon / scale (light assumption)

- Start as a **single-region (India-focused)** deployment, with a path to multi-region later.
- No complex global multi-region consistency design in this phase.

### Environment

- **Mobile**: Android and iOS apps (native or cross-platform), respecting platform UI norms but sharing UX principles.
- **Web**: Responsive web app for desktop browsers.
- No assumptions yet about:
  - Deep OS integrations (push notifications, system share sheets) in v1.
  - Full offline mode; partial caching only.

---

## 2. AI constraints

### Pedagogical behavior (non-negotiable)

- AI must **not** give direct answers by default.
- Enforced interaction pattern:

  **Hints -> Approaches -> Conceptual Explanation -> Counter-Questions -> (Only if needed) Worked solution outline**

- This pattern applies to:
  - Homework help.
  - Quiz/test feedback.
  - Doubt solving.
  - Absentee/gap-bridge teaching.

### Source of truth for content

- Syllabus-aligned content and question banks are driven by:
  - **Teacher-uploaded material** (PDFs, notes, worksheets) ingested, chunked, and embedded in a vector store.
  - Structured syllabus metadata (Class -> Subject -> Chapter -> Topic).
- AI must be **constrained exclusively to teacher-provided material**; no external knowledge, no open-internet knowledge, no general LLM knowledge for any content.
- If the AI cannot find a relevant answer in teacher-uploaded material, it must respond: **"Not found in provided material."**

### Determinism & safety

- Model configuration (temperature, system prompts, tools) must enforce:
  - **Low temperature** for maximum accuracy and consistency; no creative generation.
  - **Strict retrieval-only prompting**: the AI system prompt must instruct the model to answer solely from retrieved teacher material chunks.
  - **Syllabus adherence** and exam compatibility.
- The AI must **fail closed**:
  - If no relevant teacher material chunk is found, the system must return: **"Not found in provided material."**
  - If retrieval confidence is below threshold, the system must reject the answer and return the same message.
  - The model must not fall back to its own training data or general knowledge under any circumstance.
- Every AI response must **cite the source material chunk ID** used to generate it. If a citation cannot be provided, the response must be rejected.

### Experience threads (AI roles)

- **Homework Generator**
  - Builds daily homework tasks from **teacher-uploaded study material** for the relevant class and subject.
  - Emphasizes conceptual understanding and application, not rote repetition.

- **Quiz & Test Engine**
  - Generates:
    - Daily quizzes tied to recent teacher-provided material.
    - Chapter-level tests once a chapter is completed.
  - Evaluates responses and provides explanations for wrong answers, citing teacher material.

- **Doubt Solver / Concept Coach**
  - Reactively answers student questions using only teacher-provided material for the relevant syllabus context.
  - Enforces the progressive guidance model and avoids direct answers unless clearly pedagogically necessary.
  - If answer is not found in teacher material, responds: **"Not found in provided material."**

- **Gap-Bridge Tutor**
  - Re-teaches missed topics (absenteeism) using teacher-uploaded content for those topics.
  - Identifies weak areas from performance data and suggests remedial activities grounded in teacher material.

### Teacher content ingestion flow (v3)

- **Upload**: Teacher uploads PDFs, notes, or worksheets via a teacher-facing upload endpoint.
- **Storage**: Raw files stored securely in cloud object storage (e.g., S3 bucket) with access control.
- **Processing**: Files are parsed (PDF text extraction), cleaned, and split into semantic chunks (e.g., ~500 token segments with overlap).
- **Embedding**: Each chunk is converted into a vector embedding using an embedding model.
- **Vector storage**: Embeddings and chunk metadata stored in a vector store (e.g., pgvector extension on PostgreSQL, or a dedicated vector DB).
- **Retrieval at query time**: When a student asks a question or an activity is generated, the system performs vector similarity search over teacher material for the relevant class/subject/chapter to retrieve top-K relevant chunks.

### AI flow (v3)

```
Student Question
    |
    v
Activities Service (receives question + syllabus context)
    |
    v
Retrieval Service (vector search over teacher material for class/subject/chapter)
    |
    v
Search teacher content ONLY (top-K chunks by similarity score)
    |
    v
Inject retrieved context into prompt (system prompt enforces retrieval-only answering)
    |
    v
AI Provider (LLM generates response grounded in retrieved chunks)
    |
    v
Response Validator (checks: citation present? confidence above threshold? on-topic?)
    |
    v
If valid: return response with chunk citation to student
If invalid: return "Not found in provided material."
```

### Cost-awareness (light assumption)

- For high-frequency interactions (MCQ grading, simple feedback):
  - Prefer **structured, lower-cost** AI or deterministic evaluation where possible.
- Reserve more expensive reasoning calls for:
  - Doubt solving.
  - Conceptual explanations.
  - Custom exam generation with complex constraints.
- Embedding generation is a one-time cost per material upload; vector search is low-cost at query time.

---

## 3. Data sensitivity

### User profile data

- Student identity (name, class, board, school, contact details) is **personally identifiable information (PII)**.
- Must be:
  - Encrypted in transit (HTTPS).
  - Strongly recommended to be encrypted at rest.
- Parent/guardian information, if collected later, is also sensitive.

### Learning and performance data

- Homework completion, quiz/test scores, question-level attempts, and doubt logs are **educational performance records**.
- This data:
  - Powers personalization and progress tracking.
  - Must be protected from unauthorized access and misuse.
  - Should support deletion/anonymization upon request (subject to regulations and product policy).

### Attendance data

- **Attendance records** (days present, days absent, and associated dates) are **sensitive educational records**.
- This data:
  - Drives the **calendar-integrated attendance view** (how many days present/absent).
  - Feeds into absentee/gap-bridge flows (missed topics due to absence).
  - Must be protected from unauthorized access and misuse.
  - Should be treated with the same care as other learning/performance data (encryption, access control, consent where applicable).

### Content and teaching data

- Teacher-uploaded material (PDFs, notes, worksheets) may contain:
  - Teacher intellectual property.
  - Potential student examples or context.
- Treat this as **internal educational content**; do not expose raw material or chunk data directly to students without AI mediation.
- Access control: students may only query material uploaded by their class teacher(s); no cross-class access to teacher material.

### Regulatory posture (light assumption)

- Initial deployment context: India, with **minors** as primary users.
- Direction:
  - Be conservative with cross-border data transfers to AI providers.
  - Make consent flows explicit for:
    - Account creation and login.
    - Use of student data for personalization.
    - Use of third-party AI services.
  - Avoid sending unnecessary PII in prompts to AI providers:
    - Prefer pseudonymous IDs.
    - Provide only the minimum context required to answer.

---

## 4. Integration assumptions

### Teacher content ingestion (replaces NotebookLM)

- Teachers upload study material (PDFs, notes, worksheets) via a dedicated upload API.
- Uploaded files are:
  - Validated (file type, size limits, malware scan).
  - Stored securely in cloud object storage with teacher_id and class association.
  - Processed asynchronously: PDF parsing -> text extraction -> chunking -> embedding generation -> vector storage.
- The system maintains a **teacher_materials** record per upload and **teacher_material_chunks** per chunk with embedding vectors.
- At query time, the retrieval service searches only chunks belonging to the student's class teacher(s).
- No external knowledge feed (NotebookLM or otherwise) is consumed. All content is teacher-provided.

### External dependencies

- **AI provider** (e.g., OpenAI-compatible or Google): Stateless LLM for generation/evaluation. No persistent student data on provider side.
- **Embedding model**: For generating vector embeddings of teacher material chunks. May be same provider or a dedicated embedding API.
- No other external content or knowledge dependencies.

### Authentication & identity (6-digit MPIN)

- Student login is performed using a **6-digit MPIN only**:
  - MPIN is numeric, fixed length (6 digits).
  - Same MPIN is used across Android, iOS, and desktop to access the same account.
- Account identity (e.g., phone number or other unique identifier):
  - Is assumed to be captured during account provisioning/registration flow.
  - Is not used as a daily login credential from a UX standpoint; **students remember only their MPIN**.
- Security and UX implications:
  - MPIN-only auth is a **weaker factor** than strong passwords or multi-factor auth.
  - Requires strong protections:
    - Online brute-force protection (rate limiting, lockouts, backoff).
    - Device-level protections where applicable (e.g., OS-level biometrics as an optional shortcut layered on top of MPIN in mobile apps).

### Roles

- Primary role:
  - `student` -- full focus of this artifact.
- Future possible roles (not in current scope, but to keep in mind):
  - `parent` -- monitor progress, limited actions.
  - `teacher` -- content upload, oversight, approvals, advanced analytics.

### Question bank & evaluation

- Mindforge backend remains the **system of record** for:
  - Questions (AI-generated from teacher material, or curated).
  - Student responses.
  - Grading outcomes and explanations.
- AI providers are **stateless generators/evaluators**:
  - No long-term storage of student data on their side is assumed.
  - Outputs are stored only after backend validation where necessary.

### Attendance & calendar integration

- **Attendance** is a first-class capability:
  - The system maintains a record of **days present** and **days absent** per student (per class/term or configurable period).
  - Attendance is surfaced to the student via a **calendar-integrated view**:
    - Calendar shows which days the student was **present** vs **absent**.
    - Summary metrics (e.g., "X days present, Y days absent this month") are visible.
  - **Calendar** can be:
    - An in-app calendar view (primary): dates with present/absent markers and optional integration with device or school calendar (e.g., export or read-only sync) as a later enhancement.
  - Source of attendance data (e.g., teacher mark, school feed, or self-report) is **out of scope for this light architecture**; assume attendance data is available per day and stored in the backend. Exact APIs and sync with external calendars are deferred to final architecture.

### Other integrations

- No assumptions, in this phase, of:
  - School ERPs.
  - Payment gateways.
  - SMS/notification gateways.
- Such integrations, if required, will be treated as separate architectural concerns.

---

## 5. Risk flags

### R1: AI hallucination vs. syllabus accuracy

- **Risk**: AI may generate off-syllabus, incorrect, or misaligned content by using its general training data.
- **Impact**: Confused students; exam misalignment; trust erosion.
- **Direction**:
  - Strict grounding in teacher-uploaded material only; retrieval-only prompting enforced in system prompt.
  - Validation layer rejects any response without a valid material chunk citation.
  - AI must fail closed: "Not found in provided material." when retrieval confidence is low.

### R2: Over-helping and short-circuiting learning

- **Risk**: Students may quickly bypass effort and demand full solutions.
- **Impact**: Weak conceptual learning and dependency on AI.
- **Direction**:
  - UX must enforce the progressive guidance pattern.
  - "Full solution" views, where allowed, should be gated behind meaningful effort and reflection.

### R3: Evaluation fairness and trust

- **Risk**: Inconsistent or opaque AI-based grading decisions.
- **Impact**: Disputes over scores; loss of trust from students/parents.
- **Direction**:
  - Use deterministic scoring for objective questions (e.g., MCQs) where possible.
  - Provide clear explanations for wrong answers and scoring rules.

### R4: Data privacy and consent (minors)

- **Risk**: Mishandling minors' data, missing consent, or unclear third-party data sharing.
- **Impact**: Legal, ethical, and reputational issues.
- **Direction**:
  - Minimize third-party data exposure.
  - Clear consent text and easily discoverable privacy policy.
  - Simple mechanisms to manage accounts and, where applicable, delete data.

### R5: Teacher material quality and coverage

- **Risk**: Incomplete, low-quality, or missing teacher uploads for certain topics.
- **Impact**: AI cannot answer student queries; frequent "Not found in provided material" responses; degraded learning experience.
- **Direction**:
  - Surface material coverage metrics to teachers (which chapters/topics have material vs. gaps).
  - Fallback to "Not found in provided material" is by design; the system does not fabricate answers.
  - Encourage teachers to upload comprehensive material per chapter/topic.

### R6: Connectivity constraints and latency

- **Risk**: Relying heavily on live AI in low-connectivity contexts.
- **Impact**: Sluggish, unreliable experience; abandoned sessions.
- **Direction**:
  - Pre-generate or cache content (e.g., daily quizzes, some homework) where possible.
  - Use robust retry patterns and clear "in progress / offline" states across Android, iOS, and web.

### R7: MPIN-only authentication strength

- **Risk**: A 6-digit MPIN is susceptible to brute-force guessing.
- **Impact**: Potential account takeover if rate limiting and lockouts are weak.
- **Direction**:
  - Enforce strict online rate limiting and lockout policies.
  - Consider optional secondary factors (e.g., device binding, OS biometrics as a convenience layer).
  - UX should clearly communicate lockout and recovery flows (e.g., "forgot MPIN" tied to parent/phone verification).

### R8: Attendance data accuracy and source

- **Risk**: Attendance shown to the student may be incorrect or out of date if the source system is wrong or sync fails.
- **Impact**: Student/parent trust; incorrect gap-bridge or remedial suggestions.
- **Direction**:
  - Treat attendance as read-only from the student's perspective; no student self-correction of attendance in this scope.
  - Clearly label the period and source of attendance in the UX (e.g., "Based on class attendance" or "This month").
  - If calendar is synced with an external source, define failure and conflict handling in final architecture.

### R9: Teacher material access control

- **Risk**: Students accessing material from classes/teachers they are not enrolled with.
- **Impact**: Data leakage; irrelevant content in AI responses.
- **Direction**:
  - Retrieval service must scope vector search to material uploaded by the student's assigned teacher(s) and class only.
  - Access control enforced at the repository layer; no cross-class material access.

---

## 6. High-Level Architecture Diagram (v3)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                       MINDFORGE STUDENT EXPERIENCE                          │
│                  Light Architecture v3 -- Teacher-Grounded Closed AI        │
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
  │  TEACHER-GROUNDED AI PIPELINE:                                          │
  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  ┌───────────┐  │
  │  │ Teacher      │  │ Retrieval    │  │ AI Orchestrator│  │ Response  │  │
  │  │ Content Svc  │->│ Service      │->│ Service        │->│ Validator │  │
  │  │ (ingestion)  │  │ (vector      │  │ (prompt +      │  │ (citation │  │
  │  │              │  │  search)     │  │  LLM call)     │  │  check)   │  │
  │  └─────────────┘  └──────────────┘  └────────────────┘  └───────────┘  │
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
  │  · teacher-content.repo      │    │                                      │
  │  · embeddings.repo           │    │  NO external knowledge services.    │
  │  · ai-usage.repo             │    │  NO NotebookLM.                     │
  └──────────────┬───────────────┘    └──────────────────────────────────────┘
                 │
                 v
  ┌──────────────────────────────┐    ┌──────────────────────────────────────┐
  │  DATABASE                    │    │  CLOUD STORAGE                       │
  │  PostgreSQL                  │    │  Teacher material files (PDFs, etc) │
  │  · students · syllabus       │    └──────────────────────────────────────┘
  │  · activities · responses    │
  │  · attendance · doubts       │    ┌──────────────────────────────────────┐
  │  · sessions · audit          │    │  REDIS (optional)                    │
  │  · teacher_materials         │    │  Sessions · Rate limits · Cache      │
  │  · teacher_material_chunks   │    └──────────────────────────────────────┘
  │    (with embedding vectors)  │
  │  · ai_usage_logs             │
  └──────────────────────────────┘

  TEACHER CONTENT FLOW:
  Teacher Upload -> File Validation -> Cloud Storage -> PDF Parse -> Chunk
       -> Embed -> Vector Store (teacher_material_chunks)

  STUDENT AI FLOW:
  Student Question -> Retrieval (vector search, teacher material only)
       -> Inject context -> AI Provider -> Validate (citation check)
       -> Return response OR "Not found in provided material."

  NAVIGATION (UI LAYER):  Login -> Home -> Activity | Attendance | Doubts | Profile
                          Activity -> Results -> Home
  UX LOCKED: No change to screens, flows, or features per approved UX spec.
```

---

## STANDARD HANDOFF -- To UX / UI Agent (v3)

**PROJECT**: Mindforge Student Experience  
**PHASE**: Light Architecture (v3) -> UX / UI (navigation-first)  
**ARTIFACT SOURCE**: docs/architecture/light/Mindforge_Student_Experience_Light_Architecture_v3.md  

### 1. Context summary (for UX)

- Student learning app for Classes 6-12 (ICSE/CBSE/State), structured as:

  **Class -> Subject -> Chapter -> Topic**

- Runs on **Android app, iOS app, and desktop browser**, all backed by the same account and data model:
  - A student can move between phone and desktop with all homework, quizzes, and progress **kept in sync**.
- AI behaves as a **teacher-like guide**, not an answer vending machine:
  - Interactions follow the pattern:

    **Hints -> Approaches -> Concepts -> Counter-Questions -> (Optional) Worked solution outline**.

- AI is powered by **teacher-provided study material** (PDFs, notes uploaded by class teacher). All AI responses are grounded exclusively in this material. If the answer cannot be found, the AI responds: "Not found in provided material."
- Daily flows:
  - Homework from teacher-uploaded study material.
  - Daily quizzes.
  - Chapter-level tests.
  - Student-generated exams.
  - Doubt-solving (grounded in teacher material).
  - Absentee / gap-bridge for missed topics.
  - **Attendance with calendar integration**: students can see how many days they are present and absent, via a calendar view and summary (e.g., days present/absent this month).

### 2. Key UX constraints (delta vs v1)

- **Multi-platform parity and sync**
  - UX patterns should be consistent in intent across Android, iOS, and desktop, even if visual details follow platform conventions.
  - Critical flows (login, home, homework, quiz, doubt solving) must exist on all three platforms with **shared state**.

- **6-digit MPIN-only login**
  - Students log in using only a **6-digit numeric MPIN**.
  - UX must:
    - Make MPIN entry fast and familiar (e.g., PIN pad patterns).
    - Handle incorrect attempts gracefully, with clear error feedback.
    - Surface lockout states and recovery paths in a student-friendly way.

- **Low-bandwidth mobile-first design**
  - While desktop is supported, the **primary constraints still come from low-end Android**.
  - Design for quick load, minimal friction, and clear offline/poor-network handling across apps.

- **Learning-first guidance**
  - Every AI interaction should visually reflect the "stepwise guidance" model, not direct-answer defaults.

- **Teacher-grounded AI responses** (v3)
  - AI responses are powered by teacher-provided study material. Students may see: "Not found in provided material." when the teacher has not uploaded relevant content. This is expected behavior, not an error.

### 3. What UX SHOULD design now (with new constraints)

- **Cross-platform login and onboarding**
  - MPIN creation and confirmation flow (during registration).
  - MPIN-based login screens on Android, iOS, and web.
  - Error, lockout, and "forgot MPIN" entry points (even if backend details are TBD).

- **Navigation and information architecture**
  - Home / Today's Plan across all three platforms.
  - Syllabus browser (Class -> Subject -> Chapter -> Topic).
  - Consistent navigation schema so a student switching devices does not feel lost.

- **Core learning flows**
  - Homework, daily quiz, chapter tests, and student-generated exams (start, in-progress, results).
  - Doubt-solving and absentee gap-bridge flows.
  - Clear indicators of progress and gaps that are visible identically across devices.

- **Attendance & calendar**
  - An **attendance** view integrated with a **calendar**: students see which days they were present or absent and a summary (e.g., "X days present, Y days absent" for the selected period).
  - Calendar can be in-app only in v1; optional device/school calendar sync is a later enhancement. UX should design the in-app calendar and summary without changing existing flow diagrams.

- **Connectivity and sync states**
  - Visual patterns for:
    - Sync in progress (e.g., "Saving..." or "Syncing to cloud...").
    - Conflicts or delays (e.g., when two devices are used quickly in sequence).
    - Offline usage with queued actions where applicable.

### 4. What UX MUST NOT design yet

- Detailed backend/API specifications or platform-specific implementation details (e.g., exact push notification mechanisms).
- Full teacher/admin dashboards or school/ERP integrations.
- Payment/subscription or parent analytics beyond minimal conceptual placeholders.

### 5. Open questions UX should flag back

- How best to:
  - Communicate MPIN lockouts and recovery flows to students and parents.
  - Balance **"remember me" / auto-login** behaviors across Android, iOS, and desktop with shared-account safety.
- What visual patterns can clearly show:
  - "This is synced" vs. "Waiting to sync" when students switch devices.

### 6. Handoff status

- **Architecture Status (Light v3)**:
  - Updated to reflect **Teacher-Grounded Closed AI model**, replacing NotebookLM dependency.
  - All previous v2 constraints preserved (6-digit MPIN, multi-platform sync, attendance + calendar).
- **Approval for UX / UI exploration**:
  - **Yes -- UX / UI may proceed under these updated constraints**, using this v3 artifact as the current source of truth.

**Signature**:  
Architect AI Agent (Light Mode, v3) -- Mindforge Student Experience
