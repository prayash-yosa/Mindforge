/**
 * Mindforge Backend — Attendance Controller (Task 5.1)
 *
 * HTTP-only layer. No business logic. Delegates to AttendanceService.
 *
 * Endpoints:
 *   GET /v1/student/attendance — summary and calendar data
 */

import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { Student } from '../../common/decorators/student.decorator';
import { AuthenticatedStudent } from '../../common/guards/auth.guard';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { AttendanceService } from './attendance.service';
import { AttendanceQueryDto, AttendancePeriod } from './dto/attendance-query.dto';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('v1/student')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /**
   * GET /v1/student/attendance
   *
   * Returns attendance summary (present/absent/late counts, percentage)
   * and per-day calendar data (P/A/L/–) for the specified period.
   *
   * Accepts either a period shortcut (this_month, last_month, this_term)
   * or explicit startDate/endDate. Defaults to this_month.
   *
   * Read-only; auth required; scoped by student_id.
   */
  @Get('attendance')
  @ApiOperation({ summary: 'Get attendance summary and calendar' })
  @ApiResponse({ status: 200, description: 'Attendance summary + calendar entries' })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Student not found', type: ErrorResponseDto })
  async getAttendance(
    @Query() query: AttendanceQueryDto,
    @Student() student: AuthenticatedStudent,
  ) {
    const { startDate, endDate } = this.resolveDateRange(query);
    return this.attendanceService.getAttendance(student.id, startDate, endDate);
  }

  /** Resolve date range from period shortcut or explicit dates */
  private resolveDateRange(query: AttendanceQueryDto): { startDate: string; endDate: string } {
    if (query.startDate && query.endDate) {
      return { startDate: query.startDate, endDate: query.endDate };
    }

    const now = new Date();
    const period = query.period ?? AttendancePeriod.THIS_MONTH;

    switch (period) {
      case AttendancePeriod.THIS_MONTH: {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { startDate: this.toDateStr(start), endDate: this.toDateStr(end) };
      }
      case AttendancePeriod.LAST_MONTH: {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return { startDate: this.toDateStr(start), endDate: this.toDateStr(end) };
      }
      case AttendancePeriod.THIS_TERM: {
        // Academic term: April–September or October–March
        const month = now.getMonth(); // 0-indexed
        const year = now.getFullYear();
        if (month >= 3 && month <= 8) {
          return { startDate: `${year}-04-01`, endDate: `${year}-09-30` };
        }
        const termStart = month >= 9 ? year : year - 1;
        return { startDate: `${termStart}-10-01`, endDate: `${termStart + 1}-03-31` };
      }
      default:
        return { startDate: this.toDateStr(new Date(now.getFullYear(), now.getMonth(), 1)), endDate: this.toDateStr(now) };
    }
  }

  private toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
