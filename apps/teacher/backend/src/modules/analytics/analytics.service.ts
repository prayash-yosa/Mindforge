import { Injectable, Logger } from '@nestjs/common';
import { TestRepository } from '../../database/repositories/test.repository';
import { AttendanceRepository } from '../../database/repositories/attendance.repository';
import { ClassRepository } from '../../database/repositories/class.repository';
import { EntityNotFoundException } from '../../common/exceptions/domain.exceptions';

export interface ClassKpis {
  classId: string;
  subject: string;
  averageScore: number;
  attendancePercentage: number;
  totalStudents: number;
  totalTests: number;
  testsThisWeek: number;
  atRiskStudents: AtRiskStudent[];
}

export interface AtRiskStudent {
  studentId: string;
  studentName: string;
  reason: string;
  attendancePercentage?: number;
  averageScore?: number;
}

export interface ScoreTrend {
  testId: string;
  testTitle: string;
  date: string;
  classAverage: number;
  highestScore: number;
  lowestScore: number;
  totalStudents: number;
}

export interface AttendanceTrend {
  week: string;
  presentPercentage: number;
  totalSessions: number;
  totalStudents: number;
}

export interface WeakConcept {
  concept: string;
  averageScore: number;
  testCount: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly testRepo: TestRepository,
    private readonly attendanceRepo: AttendanceRepository,
    private readonly classRepo: ClassRepository,
  ) {}

  async getClassKpis(classId: string): Promise<ClassKpis> {
    const cls = await this.classRepo.findClassById(classId);
    if (!cls) throw new EntityNotFoundException('Class', classId);

    const students = await this.classRepo.findStudentsByClass(classId);
    const tests = await this.testRepo.findDefinitionsByClass(classId);

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const testsThisWeek = tests.filter((t) => t.createdAt >= weekStart).length;

    const sessions = await this.classRepo.findSessionsByClass(classId);
    const totalSessions = sessions.length;

    let totalAbsent = 0;
    let totalPossible = totalSessions * students.length;

    for (const session of sessions) {
      const records = await this.attendanceRepo.findBySession(session.id);
      totalAbsent += records.filter((r) => r.status === 'absent').length;
    }

    const attendancePercentage = totalPossible > 0
      ? Math.round(((totalPossible - totalAbsent) / totalPossible) * 100)
      : 100;

    let totalScore = 0;
    let totalMaxMarks = 0;

    for (const test of tests.filter((t) => t.status === 'closed' || t.status === 'published')) {
      const attempts = await this.testRepo.findAttemptsByTest(test.id);
      for (const a of attempts) {
        if (a.status === 'evaluated') {
          totalScore += a.scoredMarks;
          totalMaxMarks += a.totalMarks;
        }
      }

      if (test.mode === 'offline') {
        const marks = await this.testRepo.findMarksByTest(test.id);
        for (const m of marks) {
          totalScore += m.marksObtained;
          totalMaxMarks += m.maxMarks;
        }
      }
    }

    const averageScore = totalMaxMarks > 0 ? Math.round((totalScore / totalMaxMarks) * 100) : 0;

    const atRiskStudents = await this.identifyAtRiskStudents(classId, students, sessions, tests);

    return {
      classId,
      subject: cls.subject,
      averageScore,
      attendancePercentage,
      totalStudents: students.length,
      totalTests: tests.length,
      testsThisWeek,
      atRiskStudents,
    };
  }

  async getScoreTrends(classId: string): Promise<ScoreTrend[]> {
    const tests = await this.testRepo.findDefinitionsByClass(classId);
    const trends: ScoreTrend[] = [];

    for (const test of tests.filter((t) => t.status !== 'draft')) {
      const attempts = await this.testRepo.findAttemptsByTest(test.id);
      const evaluated = attempts.filter((a) => a.status === 'evaluated');

      if (evaluated.length === 0) continue;

      const scores = evaluated.map((a) =>
        a.totalMarks > 0 ? (a.scoredMarks / a.totalMarks) * 100 : 0,
      );

      trends.push({
        testId: test.id,
        testTitle: test.title,
        date: test.scheduledAt?.toISOString().split('T')[0] ?? test.createdAt.toISOString().split('T')[0],
        classAverage: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
        highestScore: Math.round(Math.max(...scores)),
        lowestScore: Math.round(Math.min(...scores)),
        totalStudents: evaluated.length,
      });
    }

    return trends.sort((a, b) => a.date.localeCompare(b.date));
  }

  async getAttendanceTrends(classId: string, weeks: number = 8): Promise<AttendanceTrend[]> {
    const students = await this.classRepo.findStudentsByClass(classId);
    const totalStudents = students.length;
    if (totalStudents === 0) return [];

    const trends: AttendanceTrend[] = [];
    const now = new Date();

    for (let w = 0; w < weeks; w++) {
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - w * 7);
      weekEnd.setHours(23, 59, 59, 999);

      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const sessions = await this.classRepo.findSessionsByClass(classId, weekStart, weekEnd);
      if (sessions.length === 0) continue;

      let totalAbsent = 0;
      for (const session of sessions) {
        const records = await this.attendanceRepo.findBySession(session.id);
        totalAbsent += records.filter((r) => r.status === 'absent').length;
      }

      const totalPossible = sessions.length * totalStudents;
      const presentPercentage = totalPossible > 0
        ? Math.round(((totalPossible - totalAbsent) / totalPossible) * 100)
        : 100;

      trends.push({
        week: weekStart.toISOString().split('T')[0],
        presentPercentage,
        totalSessions: sessions.length,
        totalStudents,
      });
    }

    return trends.reverse();
  }

  private async identifyAtRiskStudents(
    classId: string,
    students: any[],
    sessions: any[],
    tests: any[],
  ): Promise<AtRiskStudent[]> {
    const atRisk: AtRiskStudent[] = [];

    for (const student of students) {
      let absentCount = 0;
      for (const session of sessions.slice(-10)) {
        const records = await this.attendanceRepo.findBySession(session.id);
        if (records.some((r) => r.studentId === student.studentId && r.status === 'absent')) {
          absentCount++;
        }
      }

      const recentSessions = Math.min(sessions.length, 10);
      const attendPct = recentSessions > 0
        ? Math.round(((recentSessions - absentCount) / recentSessions) * 100)
        : 100;

      if (attendPct < 75) {
        atRisk.push({
          studentId: student.studentId,
          studentName: student.studentName,
          reason: 'Low attendance',
          attendancePercentage: attendPct,
        });
        continue;
      }

      let studentTotal = 0;
      let studentMax = 0;

      for (const test of tests.filter((t: any) => t.status !== 'draft')) {
        const attempt = await this.testRepo.findAttemptByStudentAndTest(student.studentId, test.id);
        if (attempt && attempt.status === 'evaluated') {
          studentTotal += attempt.scoredMarks;
          studentMax += attempt.totalMarks;
        }
      }

      const avgScore = studentMax > 0 ? Math.round((studentTotal / studentMax) * 100) : null;
      if (avgScore !== null && avgScore < 40) {
        atRisk.push({
          studentId: student.studentId,
          studentName: student.studentName,
          reason: 'Low average score',
          averageScore: avgScore,
        });
      }
    }

    return atRisk;
  }
}
