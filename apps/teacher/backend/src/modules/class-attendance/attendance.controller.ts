import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Teacher, AuthenticatedTeacher } from '../../common/decorators/teacher.decorator';
import { AttendanceService } from './attendance.service';
import { AuditService } from '../../shared/audit/audit.service';
import { MarkAttendanceDto, UpdateAttendanceRecordDto } from './dto/mark-attendance.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';

@ApiTags('Attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly auditService: AuditService,
  ) {}

  @Get('session/:sessionId')
  async getSessionAttendance(@Param('sessionId') sessionId: string) {
    const rows = await this.attendanceService.getSessionAttendance(sessionId);
    return { success: true, data: rows };
  }

  @Post('mark')
  @HttpCode(HttpStatus.OK)
  async markAttendance(
    @Teacher() teacher: AuthenticatedTeacher,
    @Body() dto: MarkAttendanceDto,
  ) {
    const result = await this.attendanceService.markAttendance(teacher.teacherId, dto);
    this.auditService.log({
      action: 'attendance.mark',
      actor: teacher.teacherId,
      requestId: result.sessionId,
      details: { absentCount: result.marked, sessionId: result.sessionId },
    });
    return { success: true, data: result };
  }

  @Patch('record/:recordId')
  async updateRecord(
    @Teacher() teacher: AuthenticatedTeacher,
    @Param('recordId') recordId: string,
    @Body() dto: UpdateAttendanceRecordDto,
  ) {
    await this.attendanceService.updateRecord(recordId, teacher.teacherId, dto);
    return { success: true, data: { updated: true } };
  }

  @Get('summary')
  async getAttendanceSummary(@Query() query: AttendanceQueryDto) {
    if (!query.classId) {
      return { success: true, data: [] };
    }

    const now = new Date();
    let from: Date;
    let to: Date = now;

    switch (query.period) {
      case 'weekly': {
        from = new Date(now);
        from.setDate(now.getDate() - now.getDay());
        from.setHours(0, 0, 0, 0);
        break;
      }
      case 'monthly': {
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      }
      default: {
        from = query.from ? new Date(query.from) : new Date(now.getFullYear(), now.getMonth(), 1);
        to = query.to ? new Date(query.to) : now;
        break;
      }
    }

    const summaries = await this.attendanceService.getAttendanceSummary(query.classId, from, to);
    return {
      success: true,
      data: summaries,
      meta: { classId: query.classId, from: from.toISOString(), to: to.toISOString(), period: query.period ?? 'custom' },
    };
  }

  @Post('alerts/check-weekly')
  @HttpCode(HttpStatus.OK)
  async triggerWeeklyAlertCheck(
    @Teacher() teacher: AuthenticatedTeacher,
    @Query('classId') classId: string,
  ) {
    if (!classId) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'classId query param required' } };
    }

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const alertedStudents = await this.attendanceService.checkWeeklyAbsenceAlerts(
      classId,
      weekStart,
      weekEnd,
    );

    this.auditService.log({
      action: 'attendance.weeklyAlertCheck',
      actor: teacher.teacherId,
      requestId: classId,
      details: { classId, alertedCount: alertedStudents.length },
    });

    return {
      success: true,
      data: {
        classId,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        alertedStudentIds: alertedStudents,
        alertCount: alertedStudents.length,
      },
    };
  }
}
