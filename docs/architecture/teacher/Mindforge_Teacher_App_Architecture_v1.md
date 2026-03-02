# Mindforge Teacher App – Architecture (v1)

**Artifact name**: Mindforge_Teacher_App_Architecture_v1  
**Suggested file path**: `docs/architecture/teacher/Mindforge_Teacher_App_Architecture_v1.md`  

**Related artifacts**:  
- Student Light Architecture: `docs/architecture/light/Mindforge_Student_Experience_Light_Architecture_v2.md`  
- Workspace Architecture: `docs/architecture/workspace-architecture.md`  
- Teacher Requirements: `docs/Requirements/Teacher_App_Product_Requirements_Final.md`  

> Scope: Architecture for the **Teacher application** (frontend + backend) within the existing Mindforge monorepo.  
> Student app is already implemented; this document defines the **teacher-facing capabilities** and the **backend changes** needed to support teacher requirements, without redesigning the student app UX.

---

## 1. Goals & Non‑Goals

### 1.1 Goals

- Provide a dedicated **Teacher app** (frontend + backend) that supports:
  - **Class & attendance management** per session (1‑hour class, default Present, mark Absentees).
  - **Attendance analytics** (daily/weekly/monthly, % and trends) shared with Student/Parent/Admin where appropriate.
  - **Syllabus upload** (PDF/Image) with AI processing into structured learning units.
  - **Test system**:
    - Online daily quiz (objective only, **no numericals**).
    - Offline (printable PDF) tests with MCQ to long/numerical questions.
  - **Evaluation & analytics**:
    - Auto‑graded online tests.
    - Teacher-entered offline marks.
    - Performance and attendance dashboards.
  - **Alerts & notifications**:
    - Absence >2 days/week.
    - Missed online test deadlines.
    - Auto‑submitted tests due to timer.

- Integrate teacher capabilities **cleanly** into the existing workspace:
  - Dedicated `apps/teacher/frontend` & `apps/teacher/backend`.
  - All traffic via the **API Gateway**.
  - Use `@mindforge/shared` for shared types/contracts.

### 1.2 Non‑Goals (v1)

- No major redesign of the Student app UX; Student remains a **consumer** of:
  - Attendance aggregates.
  - Tests and results created by the Teacher app.
- No direct integration with school ERPs, SMS gateways, or payment systems in this phase.
- No full teacher‑facing grading automation for **offline descriptive answers** beyond marks entry and storage (AI assists with model answers, but teacher remains final authority).

---

## 2. Placement in Workspace Architecture

The Teacher app fits into the existing monorepo as defined in `workspace-architecture.md`:

```text
Mindforge/
├── apps/
│   ├── teacher/
│   │   ├── frontend/   # React 19 + Vite — Teacher UI (:5175)
│   │   └── backend/    # NestJS — Teacher microservice (:3003)
├── services/
│   └── gateway/        # API Gateway (NestJS) — role-based routing
├── shared/             # @mindforge/shared
└── docs/
```

**Key rules**:

- Teacher frontend → **Gateway** → Teacher backend.
- Teacher backend:
  - Owns **teacher‑facing domain**: class sessions, attendance mark entry, syllabus uploads, test definitions (online & offline), evaluation, teacher dashboards.
  - Exposes APIs that Student/Parent/Admin backends may consume **via gateway** for cross‑role features (attendance views, analytics).
- Shared types (DTOs, enums) live in `@mindforge/shared` to avoid cross‑service imports.

---

## 3. High‑Level Architecture

### 3.1 Components

1. **Teacher Frontend (React + Vite)**  
   - Role: `Teacher` (and `Admin` with elevated capabilities).  
   - Key modules:
     - Class & attendance screen (per class session).
     - Syllabus upload & processing status.
     - Test builder:
       - Online daily quiz config (objective only).
       - Offline printable test config (with numericals and long answers).
     - Results & analytics dashboards.
     - Alerts & notifications list.

2. **Teacher Backend (NestJS)**  
   Logical modules:

   - **Class & Attendance Module**
     - Class definition & timetable.
     - Student–class–section mapping.
     - Attendance records per class session.
     - Attendance alerts engine (absent >2 days/week).

   - **Syllabus & AI Ingestion Module**
     - File upload (PDF/Image) to object storage.
     - OCR + text extraction pipeline.
     - AI‑based concept extraction:
       - Concept summary.
       - Learning objectives.
       - Numerical presence flag.
     - Stores structured “LessonSession” entities, linked to classes.

   - **Test Authoring & Generation Module**
     - **Online daily quiz** (no numericals):
       - Objective types: MCQ, Fill in blanks, True/False only.
       - Timer logic: 1 mark = 1 minute.
       - Question navigation & status states.
     - **Offline printable tests**:
       - Question mix: MCQ, FIB, T/F, Very Short, Short, Long (+ numericals).
       - PDF generation:
         - Student Question Paper.
         - Teacher Answer Key with solutions & explanations.
       - AI generation for:
         - Numericals (if syllabus has numericals).
         - Model answers & stepwise solutions.

   - **Evaluation & Results Module**
     - Online test evaluation:
       - Auto‑grade objective items.
       - Store score, % and attempted vs not‑attempted counts.
     - Offline test evaluation:
       - Teacher mark entry per question / per section.
       - Aggregate analytics updates.

   - **Notifications & Alerts Module**
     - Absence alerts (>2 days/week).
     - Missed online test deadlines.
     - Auto‑submission notifications.
     - Delivery channels:
       - For v1: in‑app notifications + push/email hooks (implementation details deferred to shared notification service in future).

   - **Analytics Module**
     - Teacher dashboards:
       - Weekly performance tracking.
       - Attendance trends.
       - Score trends.
       - Weak concepts & students needing extra coaching.
     - Exposes aggregate read APIs for Student/Parent/Admin views (with appropriate role scoping).

3. **AI Integration Layer** (within Teacher backend)

   - A dedicated NestJS module (e.g. `AiOrchestratorModule`) encapsulating all AI calls:
     - OCR and text extraction (where not handled by a separate service).
     - Concept extraction from syllabus.
     - Question generation (online/offline).
     - Explanation / model‑answer generation.
   - External LLM/provider integration:
     - Strict prompt templates aligned with:
       - “No numericals” rule for online tests.
       - Explanation requirements for offline tests.
   - All prompts and outputs are **logged and rate‑limited** via Teacher backend.

4. **Database (Teacher Service)**

   - PostgreSQL schema for Teacher backend (separate DB or schema from Student, as per workspace pattern).
   - Core tables (conceptual):
     - `teacher` (if not in shared auth store; otherwise refer via `teacher_id`).
     - `class` (grade, section, subject, etc.).
     - `class_session` (1‑hour instances with datetime, teacher, subject).
     - `class_student` (mapping students to classes/sections).
     - `attendance_record`:
       - `class_session_id`, `student_id`, `status` (P/A), `timestamp`, `source`, `editable_until`.
     - `syllabus_document` (file metadata, class, subject, date, duration).
     - `lesson_session` (structured AI output: concepts, objectives, has_numericals flag).
     - `test_definition` (online/offline, scope, marks, timing).
     - `test_question` (question text, type, options, correct answer, explanation).
     - `test_attempt` (online only: student_id, start/end times, marks).
     - `offline_mark_entry` (per student/test/section marks).
     - `notification_event` (type, recipient roles, payload, delivered boolean).
     - `teacher_dashboard_snapshot` (optional pre‑aggregated metrics).

---

## 4. Key Data Flows

### 4.1 Class & Attendance

1. **Class & student mapping**
   - Teacher (or admin) defines classes, sections, timetables in Teacher app.
   - `class`, `class_session`, `class_student` tables are maintained in Teacher backend.
   - Student/Parent apps **read** aggregated attendance & class info via gateway → Teacher backend (read‑only).

2. **Marking attendance**
   - On starting a class session, Teacher app:
     - Creates or opens a `class_session`.
     - UI defaults every student to **Present**.
   - Teacher marks absentees only:
     - For each absent student, writes an `attendance_record` with `status = ABSENT`.
     - Backend may store implicit “Present” inference for others, or materialise explicit `PRESENT` rows in a nightly job.
   - Attendance is editable same day:
     - Records are mutable until `editable_until` (end of day).
     - Admin overrides allowed via Admin app (future).

3. **Attendance aggregation & analytics**
   - Periodic jobs or on‑the‑fly queries aggregate:
     - Daily attendance per class/student.
     - Weekly and monthly summaries, including % attendance.
   - Exposed via read APIs:
     - Teacher dashboard (daily/weekly/monthly views).
     - Student/Parent view (limited scope).

4. **Attendance alerts**
   - Weekly job (or streaming logic) checks:
     - Students absent **>2 days in a calendar week**.
   - For each match:
     - Creates `notification_event` for:
       - Teacher (in‑app + email/push).
       - Parent (via Parent service; integration done through gateway/notification system).

### 4.2 Syllabus Upload & AI Processing

1. Upload:
   - Teacher selects file (PDF/Image) and tags:
     - Class, Subject, Date, Duration (1 hour).
   - Frontend → Gateway → Teacher backend:
     - Stores file in object storage (e.g. S3 bucket).
     - Creates `syllabus_document` record (pending processing).

2. AI Processing:
   - Background worker (queue in Teacher backend) picks up new `syllabus_document` entries.
   - Orchestrator:
     - Runs OCR if needed.
     - Extracts raw text.
     - Calls LLM to:
       - Generate structured concept summary.
       - Identify key learning objectives.
       - Detect presence of numericals.
     - Stores result as `lesson_session` linked to the document and class session.

3. Downstream impact:
   - **Online daily quiz generator**:
     - Uses `lesson_session` concepts and objectives for question generation (no numericals).
   - **Offline test generator**:
     - Uses both concept summaries and numerical presence flags to create appropriate question mixes.

### 4.3 Online Test Flow (Daily Quiz)

1. Teacher configures a daily quiz:
   - Scope: class, subject, date, linked `lesson_session` or manual selection.
   - Determines marks and allowed question types (MCQ/FIB/T/F).
   - Backend ensures **no numericals** in generated questions.

2. AI question generation:
   - Teacher backend calls AI orchestrator:
     - Strict prompts:
       - Only MCQ, FIB, T/F.
       - No calculations or value‑solving.
     - Returns candidate questions; backend validates structure.
   - Questions stored in `test_question` linked to `test_definition`.

3. Student attempts:
   - Student app retrieves test definition/questions via gateway.
   - Timer logic:
     - 1 mark = 1 minute.
     - Countdown visible to student.
   - Navigation:
     - Next/Previous.
     - Question number panel with states (Not Visited, Visited/Not Answered, Answered, Not Attempted after submission).

4. Auto submission & evaluation:
   - When timer ends:
     - Teacher backend auto‑submits attempt.
     - Marks unanswered questions as “Not Attempted” with 0 marks.
   - Evaluation engine:
     - Auto‑grades all items.
     - Stores score, % and attempted counts.

5. Result screen & notifications:
   - Result details:
     - For each question:
       - Question, student answer, correct answer, concept explanation.
   - Notifications raised to:
     - Student.
     - Parent.
     - Teacher.

### 4.4 Offline Test (Printable PDF)

1. Teacher configures test:
   - Selects scope (chapters/lessons).
   - Chooses total marks and duration.
   - Chooses question mix:
     - MCQ, FIB, T/F, Very Short, Short, Long, Numericals (allowed).

2. AI generation:
   - For concept questions:
     - LLM generates MCQ/FIB/short/long questions with answers.
   - For numericals (if `lesson_session.has_numericals` is true):
     - LLM generates similar numerical problems.
     - Produces stepwise solutions.

3. PDF generation:
   - Templating engine composes:
     - School Header, Class, Subject, Date, Total Marks, Duration.
     - Section divisions and marks per question.
   - Two PDFs:
     - Student Question Paper.
     - Teacher Answer Key (with solutions & explanations).

4. Distribution:
   - Teacher downloads/prints PDFs.
   - Optional sharing via Parent app/email later.

### 4.5 Evaluation Engine & Analytics

1. Online tests: fully auto‑graded (see above).  
2. Offline tests:
   - Teacher enters marks per student/test (and optionally per question/section).
   - Teacher backend updates analytics tables.
3. Dashboards:
   - Teacher sees:
     - Weekly performance tracking per class.
     - Attendance and score trends.
     - Weak concepts and flagged students for extra coaching.
   - Student/Parent see restricted subsets (own student only).

---

## 5. Cross‑App Integration & Boundaries

### 5.1 With Student App

- **Attendance**:
  - Teacher backend is the **system of record** for attendance.
  - Student app reads:
    - Daily/weekly/monthly attendance summaries.
    - Calendar view (consistent with student experience attendance UI).

- **Tests**:
  - Student app consumes:
    - Online test definitions/questions from Teacher backend.
    - Evaluation results (scores, explanations).

### 5.2 With Parent & Admin Apps

- Parent app:
  - Reads attendance summaries and alerts (absent >2 days/week).
  - Reads test results & explanations for their student(s).

- Admin app:
  - Elevated views over attendance and analytics.
  - May override attendance for compliance (future).

> All cross‑role read access uses the **Gateway + Teacher backend**; no direct DB sharing between apps.

---

## 6. Security, Roles & Data Sensitivity

### 6.1 Roles & Access

- **Teacher**:
  - Full access to teacher app UI and teacher backend APIs for:
    - Own classes, sessions, syllabus, tests, and analytics.
  - Cannot view other teachers’ classes unless given additional role/permission.

- **Student / Parent / Admin**:
  - Access Teacher backend via gateway only for:
    - Read‑only attendance and analytics scoped to their student(s) or institution.

### 6.2 Data Classification

- **Attendance records**:
  - Sensitive educational records (as per Student Light Architecture).
  - Require encryption in transit; encryption at rest strongly recommended.

- **Test and performance data**:
  - Same sensitivity as learning/performance data in Student app.

- **Syllabus content & AI outputs**:
  - Internal educational content; avoid exposing raw uploads directly to students.

---

## 7. Key Risks & Mitigations

1. **Incorrect attendance impacting alerts & analytics**
   - Mitigation:
     - Same‑day edit window.
     - Admin override capability (Admin app).
     - Clear “Last updated” timestamps on attendance views.

2. **AI‑generated questions violating rules (numericals in online tests)**
   - Mitigation:
     - Hard rule enforcement in backend:
       - Reject any question with numeric patterns for online tests.
     - Pre‑deploy test suites for AI prompts.

3. **AI quality and syllabus alignment**
   - Mitigation:
     - Use `lesson_session` as the grounding source.
     - Provide teachers the ability to preview and regenerate test questions before finalising.

4. **Performance & cost of AI operations**
   - Mitigation:
     - Queue‑based processing for heavy operations (OCR, PDF, offline tests).
     - Cache generated tests and explanations for reuse.

5. **Notification overload**
   - Mitigation:
     - Coalesce alerts (e.g., a daily rollup).
     - Allow per‑channel preference configuration later.

---

## 8. Implementation Order (Architecture‑Aligned)

Aligning with product dependency order:

1. Class & Student Mapping (Teacher backend: `class`, `class_student`, `class_session`).
2. Attendance Module (records, aggregation, teacher UI).
3. Syllabus Upload Module (file storage, OCR/ingest).
4. AI Concept Extraction Engine (lesson sessions).
5. Online Question Generator (objective only, no numericals).
6. Printable Question Generator (concept + numericals).
7. Explanation Generation Engine (model answers, concept explanations, stepwise numericals).
8. Timer Engine (online tests).
9. Navigation & Question Status Engine (online tests).
10. Auto Submission Logic (timer expiry).
11. Evaluation Engine (online auto‑grading + offline mark entry).
12. PDF Generator (Student + Teacher versions).
13. Analytics Engine (attendance + performance).
14. Notification Engine (in‑app + external hooks).

---

## STANDARD HANDOFF – To UX / UI Agent (Teacher App)

**PROJECT**: Mindforge Teacher App  
**PHASE**: Architecture → UX / UI (navigation‑first)  
**ARTIFACT SOURCE**: `docs/architecture/teacher/Mindforge_Teacher_App_Architecture_v1.md`  

### Context summary (for UX)

- New Teacher app (React + Vite) with its own backend (NestJS), integrated into existing Mindforge monorepo via the API Gateway.
- Core teacher workflows:
  - **Take attendance** per 1‑hour class session (default Present, mark Absentees only) with daily/weekly/monthly calendar views.
  - **Upload syllabus** (PDF/Image) and see processing state (concepts, objectives, numericals flag).
  - **Create tests**:
    - Online daily quiz (objective only, no numericals; with timer and navigation).
    - Offline printable tests (PDF: student paper + teacher key).
  - **View results & analytics**: attendance trends, performance, weak concepts, students needing extra coaching.
  - **See alerts** for high absence, missed tests, auto‑submissions.

### What UX SHOULD design now

- **Global navigation & entry points** for:
  - Classes & Attendance.
  - Syllabus Upload & AI processing status.
  - Test Builder (online & offline).
  - Results & Analytics.
  - Alerts & Notifications.

- **Core flows & screens** (examples, not exhaustive):
  - Take attendance for a class session (including late edits same day).
  - View attendance in a calendar (days present/absent, weekly and monthly counts).
  - Upload syllabus, see processing, and inspect extracted concepts.
  - Configure an online daily quiz (scope, marks, time) and preview/approve generated questions.
  - Configure an offline test and download PDFs.
  - View test results and analytics dashboard.

### UX constraints & rules

- Teacher app must assume **low to mid‑range devices** and moderate connectivity but can be slightly less constrained than student mobile UX.
- Attendance calendar must:
  - Clearly indicate present vs absent days.
  - Show summary metrics (e.g., “X days present, Y days absent this month”).
- Online tests:
  - Must visually enforce “no numericals” for daily quiz.
  - Must show timer and question navigation with clear states (Not Visited / Visited / Answered / Not Attempted).

### Open questions for UX / Product

1. How much **filtering and aggregation** do teachers need on attendance calendars (per class, per student, per term)?
2. What is the **minimum viable complexity** for the teacher dashboard in v1 (charts vs lists)?
3. How should offline test PDFs be **visually branded** and how much layout customisation do teachers need?

### Handoff status

- Teacher app architecture and module boundaries are defined and aligned with the workspace architecture and student Light Architecture v2.
- **UX / UI may now proceed** to design Teacher app flows and screens using this document as the primary architectural constraint.

**Signature**:  
Architect AI Agent – Mindforge Teacher App (v1)

