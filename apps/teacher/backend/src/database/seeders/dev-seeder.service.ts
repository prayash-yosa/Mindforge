import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TeacherRepository } from '../repositories/teacher.repository';
import { ClassRepository } from '../repositories/class.repository';

@Injectable()
export class DevSeederService implements OnModuleInit {
  private readonly logger = new Logger(DevSeederService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly teacherRepo: TeacherRepository,
    private readonly classRepo: ClassRepository,
  ) {}

  async onModuleInit() {
    const isProduction = this.configService.get<boolean>('isProduction');
    if (isProduction) return;

    this.logger.log('Running development seeder...');

    const existing = await this.teacherRepo.findByExternalId('T001');
    if (existing) {
      this.logger.log('Seed data already exists, skipping.');
      return;
    }

    const teacher = await this.teacherRepo.create({
      externalId: 'T001',
      displayName: 'Ms. Priya Sharma',
      email: 'priya.sharma@mindforge.edu',
      subjects: ['Mathematics', 'Science'],
    });

    const class8A = await this.classRepo.createClass({
      grade: '8',
      section: 'A',
      subject: 'Mathematics',
      academicYear: '2025-2026',
      teacherId: teacher.id,
    });

    const class8B = await this.classRepo.createClass({
      grade: '8',
      section: 'B',
      subject: 'Science',
      academicYear: '2025-2026',
      teacherId: teacher.id,
    });

    const students = [
      { name: 'Aarav Kumar', id: '12131', roll: '01' },
      { name: 'Ankita Singh', id: '12132', roll: '02' },
      { name: 'Rohan Patel', id: '12133', roll: '03' },
      { name: 'Diya Gupta', id: '12134', roll: '04' },
      { name: 'Kabir Verma', id: '12135', roll: '05' },
    ];

    for (const s of students) {
      await this.classRepo.addStudentToClass({
        classId: class8A.id,
        studentId: s.id,
        studentName: s.name,
        rollNumber: s.roll,
      });
      await this.classRepo.addStudentToClass({
        classId: class8B.id,
        studentId: s.id,
        studentName: s.name,
        rollNumber: s.roll,
      });
    }

    const now = new Date();
    const sessionsCreated: string[] = [];
    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      const date = new Date(now);
      date.setDate(now.getDate() - dayOffset);

      const mathTime = new Date(date);
      mathTime.setHours(9, 0, 0, 0);
      const mathEnd = new Date(now);
      mathEnd.setDate(now.getDate() + 7);
      mathEnd.setHours(23, 59, 59, 999);

      const mathSession = await this.classRepo.createSession({
        classId: class8A.id,
        teacherId: teacher.id,
        subject: 'Mathematics',
        scheduledAt: mathTime,
        durationMinutes: 45,
        editableUntil: mathEnd,
      });
      sessionsCreated.push(mathSession.id);

      const sciTime = new Date(date);
      sciTime.setHours(11, 0, 0, 0);
      const sciEnd = new Date(now);
      sciEnd.setDate(now.getDate() + 7);
      sciEnd.setHours(23, 59, 59, 999);

      const sciSession = await this.classRepo.createSession({
        classId: class8B.id,
        teacherId: teacher.id,
        subject: 'Science',
        scheduledAt: sciTime,
        durationMinutes: 45,
        editableUntil: sciEnd,
      });
      sessionsCreated.push(sciSession.id);
    }

    this.logger.log(
      `Seeded: 1 teacher, 2 classes (${class8A.id}, ${class8B.id}), ${students.length} students per class, ${sessionsCreated.length} sessions`,
    );
  }
}
