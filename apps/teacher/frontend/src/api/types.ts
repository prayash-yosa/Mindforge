export interface ApiResponse<T> { success: boolean; data: T; message?: string }

export interface ClassInfo { id: string; teacherId: string; grade: string; section: string; subject: string; academicYear: string; createdAt: string }
export interface ClassSession { id: string; classId: string; subject: string; scheduledAt: string; durationMinutes: number; editableUntil: string; isAttendanceTaken: boolean }
export interface ClassStudent { id: string; classId: string; studentId: string; studentName: string; rollNumber?: string }
export interface AttendanceRow { studentId: string; studentName: string; rollNumber: string | null; status: 'present' | 'absent'; notes: string | null; recordId: string | null }
export interface AttendanceSummary { studentId: string; studentName: string; totalSessions: number; presentCount: number; absentCount: number; percentage: number }

export interface SyllabusDocument { id: string; classId: string; subject: string; fileName: string; fileType: string; fileSizeBytes: number; status: string; errorMessage?: string; classDate?: string; durationMinutes: number; uploadedAt: string }
export interface LessonDetail { id: string; syllabusDocumentId: string; classId: string; subject: string; conceptSummary: string; learningObjectives: string[]; hasNumericals: boolean; chapters: string[]; topics: string[]; createdAt: string }

export interface TestDefinition { id: string; classId: string; subject: string; title: string; mode: string; status: string; totalMarks: number; durationMinutes: number; questionTypes: string; lessonSessionId?: string; scheduledAt?: string; createdBy: string; createdAt: string }
export interface TestQuestion { id: string; testDefinitionId: string; questionType: string; questionText: string; options?: string; correctAnswer: string; explanation?: string; marks: number; orderIndex: number }
export interface PdfContent { studentPaper: string; answerKey: string; metadata: { title: string; subject: string; totalMarks: number; duration: string; date: string; questionCount: number } }

export interface ClassKpis { classId: string; subject: string; averageScore: number; attendancePercentage: number; totalStudents: number; totalTests: number; testsThisWeek: number; atRiskStudents: AtRiskStudent[] }
export interface AtRiskStudent { studentId: string; studentName: string; reason: string; attendancePercentage?: number; averageScore?: number }
export interface ScoreTrend { testId: string; testTitle: string; date: string; classAverage: number; highestScore: number; lowestScore: number; totalStudents: number }
export interface AttendanceTrend { week: string; presentPercentage: number; totalSessions: number; totalStudents: number }

export interface NotificationItem { id: string; category: string; priority: string; title: string; body: string; isRead: boolean; payload: Record<string, any> | null; createdAt: string }
