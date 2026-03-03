import {
  AttendanceStatus,
  TestMode,
  TestStatus,
  QuestionType,
  AttemptStatus,
  DocumentProcessingStatus,
  NotificationCategory,
  NotificationPriority,
} from './teacher.enums';

export interface TeacherProfile {
  id: string;
  externalId: string;
  displayName: string;
  email?: string;
  phone?: string;
  subjects: string[];
  isActive: boolean;
}

export interface ClassInfo {
  id: string;
  grade: string;
  section: string;
  subject: string;
  academicYear: string;
  teacherId: string;
}

export interface ClassSessionInfo {
  id: string;
  classId: string;
  teacherId: string;
  subject: string;
  scheduledAt: string;
  durationMinutes: number;
  editableUntil: string;
}

export interface ClassStudentMapping {
  id: string;
  classId: string;
  studentId: string;
  studentName: string;
  rollNumber?: string;
  enrolledAt: string;
}

export interface AttendanceRecordDto {
  id: string;
  classSessionId: string;
  studentId: string;
  status: AttendanceStatus;
  notes?: string;
  markedAt: string;
}

export interface AttendanceSummaryDto {
  studentId: string;
  studentName: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  attendancePercentage: number;
  period: 'daily' | 'weekly' | 'monthly';
}

export interface SyllabusDocumentDto {
  id: string;
  classId: string;
  subject: string;
  fileName: string;
  fileType: string;
  status: DocumentProcessingStatus;
  uploadedAt: string;
  processedAt?: string;
}

export interface LessonSessionDto {
  id: string;
  syllabusDocumentId: string;
  classId: string;
  subject: string;
  conceptSummary: string;
  learningObjectives: string[];
  hasNumericals: boolean;
  chapters?: string[];
  topics?: string[];
}

export interface TestDefinitionDto {
  id: string;
  classId: string;
  subject: string;
  title: string;
  mode: TestMode;
  status: TestStatus;
  totalMarks: number;
  durationMinutes: number;
  questionTypes: QuestionType[];
  lessonSessionId?: string;
  scheduledAt?: string;
}

export interface TestQuestionDto {
  id: string;
  testDefinitionId: string;
  questionType: QuestionType;
  questionText: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  marks: number;
  orderIndex: number;
}

export interface TestAttemptDto {
  id: string;
  testDefinitionId: string;
  studentId: string;
  status: AttemptStatus;
  startedAt: string;
  submittedAt?: string;
  totalMarks: number;
  scoredMarks: number;
  attemptedCount: number;
  notAttemptedCount: number;
}

export interface OfflineMarkEntryDto {
  id: string;
  testDefinitionId: string;
  studentId: string;
  sectionLabel?: string;
  questionIndex?: number;
  marksObtained: number;
  maxMarks: number;
  enteredBy: string;
}

export interface NotificationEventDto {
  id: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  recipientRole: string;
  recipientId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface TeacherDashboardKpis {
  totalClasses: number;
  todaysSessions: number;
  averageAttendance: number;
  pendingEvaluations: number;
  activeAlerts: number;
  testsThisWeek: number;
}
