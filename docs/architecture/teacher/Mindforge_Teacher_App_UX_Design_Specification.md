# Mindforge Teacher App — UX Design Specification (v1)

**Artifact name**: Mindforge_Teacher_App_UX_Design_Specification_v1  
**Artifact produced by**: UX/UI Designer AI Agent  
**Date**: February 4, 2026  
**Architecture source**: `docs/architecture/teacher/Mindforge_Teacher_App_Architecture_v1.md`  
**Images folder**: `docs/architecture/teacher/images/`

---

## 1. UX System Overview

### UX Principles
- **Teacher-first, time-respectful**: Core tasks (attendance, tests) must be 1–2 click flows.
- **Web-first, mobile-responsible**: Primary layout is desktop web, but all key flows work on tablet/phone.
- **Data clarity over decoration**: Dashboards emphasise legible numbers, trends, and alerts.
- **Consistency with Student app**: Shared color palette and visual language (sage green, cream, deep brown).
- **AI as assistant, not owner**: Teacher remains in control of syllabus, tests, and evaluation decisions.

### Global Navigation (Teacher Frontend)
- **Desktop (sidebar)**:
  - `Dashboard`
  - `Classes & Attendance`
  - `Syllabus`
  - `Tests`
  - `Results & Analytics`
  - `Alerts / Messages`
- **Mobile (bottom navigation)**:
  - `Dashboard`, `Classes`, `Syllabus`, `Tests`, `Analytics`, `Alerts`

### Core Modules (UX Scope)
- **Dashboard**: Today’s classes, attendance issues, pending test evaluations, alerts.
- **Classes & Attendance**: Per-session attendance marking, with daily/weekly calendar.
- **Syllabus**: Upload files, view AI-extracted chapters/topics and lesson concepts.
- **Tests**: Online daily quiz (objective only, no numericals) and offline printable tests.
- **Results & Analytics**: Performance and attendance trends; students needing attention.
- **Alerts / Messages**: Absence and test-related notifications.

---

## 2. Key User Flows

### 2.1 Take Attendance for a Class Session

**Goal**: Mark attendance quickly during or right after a class.

**Entry points**:
- Dashboard → Today’s timetable → `Take attendance`
- Sidebar → `Classes & Attendance`

**Happy path (desktop)**:
1. Teacher opens `Classes & Attendance` → selects **Class 8A • Math**, date auto-filled to today.
2. All students default to **Present** (green pill).
3. Teacher taps rows to toggle Absent for missing students; can add notes.
4. Teacher clicks **Save attendance** → success toast; summary updates.
5. Teacher optionally opens **View attendance calendar** to confirm aggregates.

**Happy path (mobile)**:
1. Teacher opens mobile dashboard → taps **Take attendance** card for current class.
2. Mobile attendance list shows Present/Absent pills per student.
3. Teacher toggles 1–2 students to Absent → hits **Save attendance**.
4. Teacher taps **View calendar** to see monthly summary.

**Failure / edge cases**:
- Network error on save → inline banner: “Couldn’t save attendance. Check connection.” `[Retry]`.
- Edit window expired → show non-editable state and message “Editable until 6:00 PM only.”

---

### 2.2 Upload Syllabus and Inspect AI Concepts

**Goal**: Convert raw syllabus files into structured lessons for tests and analytics.

**Entry**: Sidebar → `Syllabus`.

**Happy path**:
1. Teacher selects **Class 8 • Science** in context dropdown.
2. Drags PDF into **Upload** box, or clicks **Upload file**.
3. File appears in `Recent uploads` with status **Processing**.
4. After processing, status becomes **Ready** and the left panel shows chapters/topics.
5. Teacher clicks a topic → right panel displays **Summary**, **Learning Objectives**, and **flags** (`Has numericals: Yes/No`).

**Failure**:
- OCR/AI failure → upload shows **Failed** with reason and `Retry` button.

---

### 2.3 Configure Tests (Online Quiz & Offline Printable)

**Goal**: Create assessments from recent syllabus quickly.

**Entry**: Sidebar → `Tests`.

**Online Daily Quiz (happy path)**:
1. On `Online Daily Quiz` tab, teacher chooses **Class**, **Subject**, **Chapter**.
2. Fills **Number of questions** and **Marks per question**.
3. Ensures **“Enforce NO numericals (online)”** toggle is ON.
4. Clicks **Generate questions** (implicit in UI) → AI produces objective questions only.
5. Reviews and optionally deletes/edits any question.
6. Clicks **Save & Publish** → students see the quiz in Student app.

**Offline Printable Test (happy path)**:
1. Teacher switches to `Offline Printable Test` tab.
2. Sets total marks, duration, and question mix (MCQ, short, long, numericals).
3. Clicks **Generate PDFs** → downloads **Student Paper** and **Teacher Key with solutions**.

---

### 2.4 View Results & Analytics

**Goal**: See overall class health and find at-risk students.

**Entry**: Sidebar → `Results & Analytics`.

**Happy path**:
1. Teacher selects **Class**, **Subject**, **Period (This month)**.
2. Sees KPI cards for **Average score**, **Attendance %**, **Students at risk**, **Tests this week**.
3. Reviews charts: score over time and attendance by week.
4. Scrolls to **Students needing attention** table → clicks `View details` to open student report.

---

## 3. Navigation Map (Teacher App)

```
Desktop (Sidebar)
──────────────────────────────────
Mindforge Teacher
  • Dashboard
  • Classes & Attendance
  • Syllabus
  • Tests
  • Results & Analytics
  • Alerts / Messages


Core Flows
──────────────────────────────────

          ┌────────────────────────┐
          │      Dashboard         │
          └─────────┬──────────────┘
                    │
        ┌───────────┼───────────────────────┐
        ▼           ▼                       ▼
 Classes &       Tests                 Results &
 Attendance                           Analytics
  (Take          │                      │
 attendance)  (Online/Offline)      (Dashboards)
        │           │                      │
        ▼           ▼                      ▼
 Attendance    Test definitions      Trends, at-risk
 records       & PDFs                students

        ▼
      Alerts / Messages  (absence >2 days, missed tests, etc.)
```

Mobile bottom navigation (condensed for phone):

`Dashboard` · `Classes` · `Syllabus` · `Tests` · `Analytics` · `Alerts`

---

## 4. Screen Specifications (Desktop + Mobile)

### 4.1 Dashboard

**Desktop image**: `images/teacher-dashboard.png`  
**Mobile image**: `images/teacher-mobile-dashboard.png`

**Purpose**: Single-page overview of today’s workload and issues.

**Key UI blocks (desktop)**:
- **Top KPI cards**: `Today’s Classes`, `Attendance issues`, `Pending test evaluations`.
- **Today’s timetable**: list of upcoming classes with `Take attendance` buttons.
- **Class Attendance Summary**: per-class donut charts with Present/Absent %.
- **Recent alerts**: scrollable list (absence streaks, missed tests, auto-submits).

**Mobile differences**:
- KPI cards stacked vertically.
- Timetable and alerts shown as stacked, scrollable cards.
- Bottom nav always visible.

---

### 4.2 Classes & Attendance

**Desktop image**: `images/teacher-attendance.png`  
**Mobile image**: `images/teacher-mobile-attendance.png`

**Purpose**: Mark and review attendance for a given class session.

**Desktop layout**:
- Header controls:
  - Class dropdown (e.g. `Class 8A • Math`)
  - Date picker
  - Session time
- Summary chips: `Present`, `Absent`, `Editable until`.
- Table of students:
  - Checkbox / status pill (Present/Absent)
  - Student name
  - Roll number
  - Notes (inline or dialog)
- Side panel: mini calendar with present/absent dots; `View attendance calendar` button.
- Actions: `Save attendance`, `Mark all present`, `Undo last change`.

**Mobile layout**:
- Same information compressed into a **card list**:
  - Each student row has a big Present/Absent pill and “Add note” link.
  - Sticky footer: `Save attendance`, `Mark all present`, `View calendar`.

**States**:
- Default, Editing, Saving (spinner in buttons), Error, Locked (edit window expired).

---

### 4.3 Syllabus Upload & Concepts

**Desktop image**: `images/teacher-syllabus.png`

**Purpose**: Accept syllabus files and show AI-extracted structure.

**Layout**:
- Upload area with drag-and-drop zone and `Upload file` button.
- Recent uploads list with status pills: `Processing`, `Ready`, `Failed`.
- Extracted concepts:
  - Left: expandable list of chapters and topics.
  - Right: selected topic details (summary text, learning objectives, flags).

**States**:
- Empty (no uploads), Processing (banner + spinner), Ready, Failed.

---

### 4.4 Tests (Online & Offline)

**Desktop image**: `images/teacher-tests.png`  
**Mobile image**: `images/teacher-mobile-tests.png`

**Purpose**: Configure and generate online quizzes and offline printable tests.

**Online Daily Quiz (desktop)**:
- Controls: Class, Subject, Chapter, Number of questions, Marks per question.
- Toggle: **Enforce NO numericals (online)** — strong visual emphasis, ON by default.
- Question preview panel: objective questions only (MCQ, T/F, FIB) with type badges.
- Actions: `Regenerate questions`, `Save & Publish`.

**Offline Printable Test (desktop)**:
- Question mix sliders / inputs by type.
- Totals: marks and duration.
- Actions: `Generate PDFs` → Student paper, Teacher key.

**Mobile differences**:
- All controls stacked vertically.
- Bottom CTA bar: `Save & Publish` primary, `Regenerate questions` secondary.

---

### 4.5 Results & Analytics

**Desktop image**: `images/teacher-analytics.png`

**Purpose**: Summarise performance and attendance, highlight risks.

**Layout**:
- Filters row: Class, Subject, Period.
- KPI cards: average score, attendance %, students at risk, tests this week.
- Charts: score over time, attendance by week.
- Table: students needing attention with weak topics and quick actions.

---

## 5. Accessibility Notes (Teacher App)

- **Keyboard support**: All navigation and key actions (Save attendance, Publish, etc.) must be triggerable via keyboard.
- **Table navigation**: Attendance table rows must allow quick keyboard toggling and clear focus state.
- **Color contrast**: Same WCAG 2.1 AA baseline as Student app (4.5:1 for text, 3:1 for large text).
- **Status & alerts**:
  - Use `role="status"` / `role="alert"` for save confirmations and errors.
  - Do not rely on color alone: add icons and text labels for Present/Absent, alerts, etc.
- **Charts**: Provide text summaries (e.g., “Average score this month: 82% (↑2% from last month)”).

---

## STANDARD HANDOFF (Teacher App UX → Planner → Dev)

- **Screens covered**:
  - Dashboard (desktop + mobile)
  - Classes & Attendance (desktop + mobile)
  - Syllabus Upload & Concepts (desktop)
  - Tests: Online Daily Quiz + Offline Printable Test (desktop + mobile)
  - Results & Analytics (desktop)
- **Images**:
  - Desktop: `teacher-dashboard.png`, `teacher-attendance.png`, `teacher-syllabus.png`, `teacher-tests.png`, `teacher-analytics.png`
  - Mobile: `teacher-mobile-dashboard.png`, `teacher-mobile-attendance.png`, `teacher-mobile-tests.png`
- **Constraints obeyed**:
  - Web-first with responsive mobile layouts.
  - Online quiz: objective only, no numericals (toggle enforced in UI).
  - Attendance: default Present, quick Absent marking, clear edit window.
- **Next step**:
  - Dev agent to implement routes and components in `apps/teacher/frontend` using this spec as UI contract.

