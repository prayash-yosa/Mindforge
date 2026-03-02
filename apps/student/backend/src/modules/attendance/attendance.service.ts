/**
 * Mindforge Backend — Attendance Service (Task 2.3)
 *
 * Business logic for attendance summary and calendar.
 * Services = business logic only. No HTTP, no direct DB access.
 *
 * Checklist 2.3:
 *   [x] Business service for attendance
 *   [x] Business layer calls data access only
 */

import { Injectable, Logger } from '@nestjs/common';
import { AttendanceRepository } from '../../database/repositories/attendance.repository';
import { StudentRepository } from '../../database/repositories/student.repository';
import { StudentNotFoundException } from '../../common/exceptions/domain.exceptions';

/** Attendance summary shape */
export interface AttendanceSummary {
  studentId: string;
  period: { startDate: string; endDate: string };
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  attendancePercent: number;
}

/** Attendance calendar entry */
export interface AttendanceCalendarEntry {
  date: string;
  status: string;
}

/** Full attendance response */
export interface AttendanceResponse {
  summary: AttendanceSummary;
  calendar: AttendanceCalendarEntry[];
}

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    private readonly attendanceRepo: AttendanceRepository,
    private readonly studentRepo: StudentRepository,
  ) {}

  /**
   * Get attendance summary and calendar for a student.
   *
   * Architecture ref: §5.2 — "GET /student/attendance"
   * UX ref: Screen 5 — "Attendance summary and calendar for period"
   */
  async getAttendance(
    studentId: string,
    startDate: string,
    endDate: string,
  ): Promise<AttendanceResponse> {
    const student = await this.studentRepo.findById(studentId);
    if (!student) throw new StudentNotFoundException();

    // Get raw attendance records
    const records = await this.attendanceRepo.findByStudentAndDateRange(
      studentId,
      startDate,
      endDate,
    );

    // Get summary counts
    const statusSummary = await this.attendanceRepo.getSummaryForStudent(
      studentId,
      startDate,
      endDate,
    );

    const present = statusSummary.find((s) => s.status === 'present')?.count ?? 0;
    const absent = statusSummary.find((s) => s.status === 'absent')?.count ?? 0;
    const late = statusSummary.find((s) => s.status === 'late')?.count ?? 0;
    const totalDays = records.length;
    const attendancePercent = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

    return {
      summary: {
        studentId,
        period: { startDate, endDate },
        totalDays,
        present,
        absent,
        late,
        attendancePercent,
      },
      calendar: records.map((r) => ({
        date: r.date,
        status: r.status,
      })),
    };
  }
}
