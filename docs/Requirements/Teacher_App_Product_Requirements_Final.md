# Teacher App -- Product Requirements (Final Updated Version)

------------------------------------------------------------------------

# 1. Class & Attendance Management

## Class Structure

-   Each class session duration: 1 hour
-   Mapped to:
    -   Subject
    -   Teacher
    -   Section
    -   Student list

## Attendance Rules

-   Default: All students marked Present
-   Teacher marks only Absentees
-   Attendance taken per class session
-   Timestamp stored
-   Editable same day (Admin override allowed)

## Attendance Alerts

-   If student absent more than 2 days in a week:
    -   Notify Teacher
    -   Notify Parent

## Attendance Reports

Accessible by Teacher, Admin, Student, Parent: - Daily view - Weekly
summary - Monthly summary - Attendance % - Graphical analytics

------------------------------------------------------------------------

# 2. Syllabus Upload & AI Processing

## Upload Capability

-   Teacher uploads PDF or Image
-   Tagged with:
    -   Class
    -   Subject
    -   Date
    -   Duration (1 hour)

## AI Processing

-   Extract text (OCR if image)
-   Generate structured concept summary
-   Identify key learning objectives
-   Detect if chapter contains numericals

------------------------------------------------------------------------

# 3. Test System (Only 2 Types)

## A. Online Test (Daily Quiz Only)

### Scope

-   Generated from daily syllabus
-   Objective type only
-   Fully auto evaluated

### Strict Rule -- No Numericals

Online test must NOT include: - Calculations - Formula substitution -
Word-based numerical problems - Value-solving questions

AI must generate: - Concept-based MCQ (1 mark) - Fill in blanks (1
mark) - True/False (1 mark)

### Timer Logic

-   1 mark = 1 minute
-   Total test time = Total marks × 1 minute
-   Countdown timer visible

When timer reaches zero: 1. Auto submit 2. Test screen closes 3.
Redirect to result screen 4. Unanswered marked "Not Attempted" 5. 0
marks assigned

### Navigation Features

-   Next button
-   Previous button
-   Question Number Panel (mandatory)
-   Free navigation within time limit
-   Modify answers anytime before submission

### Question Number Panel

Status indicators: - Not Visited - Visited but Not Answered - Answered -
Not Attempted (after submission) - Clickable navigation

### Result Screen (Mandatory Explanation)

For each question: - Question - Student answer - Correct answer - Clear
concept explanation

Notifications sent to: - Student - Parent - Teacher

------------------------------------------------------------------------

## B. Offline Test (Printable PDF)

### Purpose

Traditional written examination

### Question Types Allowed

-   MCQ
-   Fill in blanks
-   True/False
-   Very Short
-   Short
-   Long answers
-   Numericals allowed

### Numerical Logic

If syllabus contains numericals: - Generate similar numericals - Include
in Short and/or Long answer sections - Provide stepwise solution

### Explanation Requirement

For every Short and Long question: AI must generate: - Model Answer -
Concept Explanation - Stepwise numerical solution (if applicable)

### PDF Structure

Must include: - School Header - Class - Subject - Date - Total Marks -
Duration - Section division - Mark weight per question

Separate versions: 1. Student Question Paper 2. Teacher Answer Key with
solutions & explanations

------------------------------------------------------------------------

# 4. Evaluation Engine

## Online Test

-   Fully auto graded
-   Instant score
-   Percentage
-   Attempted vs Not Attempted count

## Offline Test

-   Teacher enters marks manually
-   System updates analytics

------------------------------------------------------------------------

# 5. Alerts & Notifications

Notify Teacher & Parent if: - Student absent \>2 days/week - Student
misses online test deadline - Test auto-submitted due to timer

------------------------------------------------------------------------

# 6. Analytics & Monitoring

Teacher Dashboard: - Weekly performance tracking - Attendance trends -
Score trends - Weak concept identification - Students needing extra
coaching

Accessible by: - Teacher - Admin - Parent - Student (limited view)

------------------------------------------------------------------------

# 7. Development Dependency Order

1.  Class & Student Mapping
2.  Attendance Module
3.  Syllabus Upload Module
4.  AI Concept Extraction Engine
5.  Online Question Generator (No Numericals Filter)
6.  Printable Question Generator (Concept + Numericals)
7.  Explanation Generation Engine
8.  Timer Engine
9.  Navigation & Question Status Engine
10. Auto Submission Logic
11. Evaluation Engine
12. PDF Generator (Student + Teacher Version)
13. Analytics Engine
14. Notification Engine
