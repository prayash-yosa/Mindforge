import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Teacher, AuthenticatedTeacher } from '../../common/decorators/teacher.decorator';
import { ClassService } from './class.service';
import { AuditService } from '../../shared/audit/audit.service';
import { CreateClassDto } from './dto/create-class.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { AddStudentDto } from './dto/add-student.dto';

@ApiTags('Classes')
@Controller('classes')
export class ClassController {
  constructor(
    private readonly classService: ClassService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createClass(
    @Teacher() teacher: AuthenticatedTeacher,
    @Body() dto: CreateClassDto,
  ) {
    const result = await this.classService.createClass(teacher.teacherId, dto);
    this.auditService.log({
      action: 'class.create',
      actor: teacher.teacherId,
      requestId: result.id,
      details: { grade: dto.grade, section: dto.section, subject: dto.subject },
    });
    return { success: true, data: result };
  }

  @Get()
  async getMyClasses(@Teacher() teacher: AuthenticatedTeacher) {
    const classes = await this.classService.getClassesByTeacher(teacher.teacherId);
    return { success: true, data: classes };
  }

  @Get(':id')
  async getClassById(@Param('id') id: string) {
    const cls = await this.classService.getClassById(id);
    return { success: true, data: cls };
  }

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  async createSession(
    @Teacher() teacher: AuthenticatedTeacher,
    @Body() dto: CreateSessionDto,
  ) {
    const session = await this.classService.createSession(teacher.teacherId, dto);
    this.auditService.log({
      action: 'session.create',
      actor: teacher.teacherId,
      requestId: session.id,
      details: { classId: dto.classId, scheduledAt: dto.scheduledAt },
    });
    return { success: true, data: session };
  }

  @Get('sessions/:id')
  async getSession(@Param('id') id: string) {
    const session = await this.classService.getSessionById(id);
    return { success: true, data: session };
  }

  @Get(':classId/sessions')
  async getSessionsByClass(
    @Param('classId') classId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const sessions = await this.classService.getSessionsByClass(classId, from, to);
    return { success: true, data: sessions };
  }

  @Post('students')
  @HttpCode(HttpStatus.CREATED)
  async addStudent(
    @Teacher() teacher: AuthenticatedTeacher,
    @Body() dto: AddStudentDto,
  ) {
    const result = await this.classService.addStudent(dto);
    this.auditService.log({
      action: 'class.addStudent',
      actor: teacher.teacherId,
      requestId: result.id,
      details: { classId: dto.classId, studentId: dto.studentId },
    });
    return { success: true, data: result };
  }

  @Get(':classId/students')
  async getStudents(@Param('classId') classId: string) {
    const students = await this.classService.getStudentsByClass(classId);
    return { success: true, data: students };
  }

  @Delete(':classId/students/:studentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeStudent(
    @Teacher() teacher: AuthenticatedTeacher,
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
  ) {
    await this.classService.removeStudent(classId, studentId);
    this.auditService.log({
      action: 'class.removeStudent',
      actor: teacher.teacherId,
      requestId: classId,
      details: { classId, studentId },
    });
  }
}
