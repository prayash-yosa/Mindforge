import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CrossAppEndpoint } from '../../common/decorators/cross-app.decorator';
import { ClassRepository } from '../../database/repositories/class.repository';
import { AnalyticsService } from './analytics.service';
import { AttendanceService } from '../class-attendance/attendance.service';
import { EvaluationService } from '../evaluation/evaluation.service';

/**
 * Read-only endpoints consumed by Student/Parent/Admin apps via the gateway.
 * RBAC is enforced at the gateway layer; these endpoints serve aggregated data.
 */
@ApiTags('Cross-App')
@Controller('cross-app')
@Public()
export class CrossAppController {
  constructor(
    private readonly classRepo: ClassRepository,
    private readonly analyticsService: AnalyticsService,
    private readonly attendanceService: AttendanceService,
    private readonly evaluationService: EvaluationService,
  ) {}

  /**
   * List classes for Student sync setup. Returns all classes so Student can merge attendance.
   */
  @Get('classes')
  @CrossAppEndpoint()
  async getClasses() {
    const classes = await this.classRepo.findAllActiveClasses();
    return {
      success: true,
      data: {
        classes: classes.map((c) => ({ id: c.id, grade: c.grade, section: c.section, subject: c.subject })),
      },
    };
  }

  @Get('attendance/summary/:classId')
  @CrossAppEndpoint()
  async getAttendanceSummary(
    @Param('classId') classId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const fromDate = from ? new Date(from) : this.defaultFrom();
    const toDate = to ? new Date(to) : new Date();
    const data = await this.attendanceService.getAttendanceSummary(classId, fromDate, toDate);
    return { success: true, data };
  }

  @Get('attendance/student/:studentId/class/:classId')
  @CrossAppEndpoint()
  async getStudentAttendance(
    @Param('studentId') studentId: string,
    @Param('classId') classId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDate = from ? new Date(from) : this.defaultFrom();
    const toDate = to ? new Date(to) : new Date();

    const allSummary = await this.attendanceService.getAttendanceSummary(classId, fromDate, toDate);
    const studentSummary = allSummary.find((s) => s.studentId === studentId);

    return {
      success: true,
      data: studentSummary ?? {
        studentId,
        studentName: '',
        totalSessions: 0,
        presentCount: 0,
        absentCount: 0,
        percentage: 100,
      },
    };
  }

  /**
   * Get attendance calendar (per-day) for Student app sync.
   * Returns format compatible with Student AttendanceResponse.
   * Production: validates date range (max 365 days).
   */
  @Get('attendance/student/:studentId/class/:classId/calendar')
  @CrossAppEndpoint()
  async getStudentAttendanceCalendar(
    @Param('studentId') studentId: string,
    @Param('classId') classId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const fromDate = from ? new Date(from) : this.defaultFrom();
    const toDate = to ? new Date(to) : new Date();
    // Include full last day (end-of-day) so sessions on that date are not excluded
    if (from && to) toDate.setUTCHours(23, 59, 59, 999);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime()) || fromDate > toDate) {
      throw new BadRequestException('Invalid date range');
    }
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000));
    if (daysDiff > 365) {
      throw new BadRequestException('Date range exceeds 365 days');
    }

    const [summaryList, calendar] = await Promise.all([
      this.attendanceService.getAttendanceSummary(classId, fromDate, toDate).then((list) =>
        list.find((s) => s.studentId === studentId),
      ),
      this.attendanceService.getStudentAttendanceCalendar(studentId, classId, fromDate, toDate),
    ]);

    const s = summaryList ?? {
      studentId,
      studentName: '',
      totalSessions: 0,
      presentCount: 0,
      absentCount: 0,
      percentage: 100,
    };

    return {
      success: true,
      data: {
        summary: {
          studentId: s.studentId,
          period: { startDate: fromDate.toISOString().split('T')[0], endDate: toDate.toISOString().split('T')[0] },
          totalDays: s.totalSessions,
          present: s.presentCount,
          absent: s.absentCount,
          late: 0,
          attendancePercent: s.percentage,
        },
        calendar,
      },
    };
  }

  @Get('performance/:classId')
  @CrossAppEndpoint()
  async getClassPerformance(@Param('classId') classId: string) {
    const kpis = await this.analyticsService.getClassKpis(classId);
    const scores = await this.analyticsService.getScoreTrends(classId);

    return {
      success: true,
      data: {
        averageScore: kpis.averageScore,
        attendancePercentage: kpis.attendancePercentage,
        totalStudents: kpis.totalStudents,
        totalTests: kpis.totalTests,
        scoreTrends: scores,
      },
    };
  }

  @Get('performance/student/:studentId/test/:testId')
  @CrossAppEndpoint()
  async getStudentTestResult(
    @Param('studentId') studentId: string,
    @Param('testId') testId: string,
  ) {
    const attempt = await this.evaluationService.getStudentAttempt(studentId, testId);
    if (!attempt) {
      return { success: true, data: null };
    }

    const offlineMarks = await this.evaluationService.getStudentOfflineMarks(studentId, testId);

    return {
      success: true,
      data: {
        online: attempt,
        offline: offlineMarks.length > 0 ? {
          entries: offlineMarks,
          totalObtained: offlineMarks.reduce((s, m) => s + m.marksObtained, 0),
          totalMax: offlineMarks.reduce((s, m) => s + m.maxMarks, 0),
        } : null,
      },
    };
  }

  private defaultFrom(): Date {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d;
  }
}
