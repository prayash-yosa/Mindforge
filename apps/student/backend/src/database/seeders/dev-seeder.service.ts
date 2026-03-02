/**
 * Mindforge Backend — Development Data Seeder (Sprint 3)
 *
 * Seeds test data on startup in development mode:
 *   - Syllabus metadata (Class 8 CBSE Math chapters)
 *   - Activities (homework, quiz) for the test student
 *   - Questions for each activity
 *   - Attendance records
 *
 * Standards: Deterministic — same seed produces same data structure.
 */

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SyllabusRepository } from '../repositories/syllabus.repository';
import { ActivityRepository } from '../repositories/activity.repository';
import { QuestionRepository } from '../repositories/question.repository';
import { AttendanceRepository } from '../repositories/attendance.repository';
import { StudentRepository } from '../repositories/student.repository';
import { ActivityType, ActivityStatus } from '../entities/activity.entity';
import { QuestionType } from '../entities/question.entity';
import { AttendanceStatus } from '../entities/attendance.entity';

@Injectable()
export class DevSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DevSeederService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly studentRepo: StudentRepository,
    private readonly syllabusRepo: SyllabusRepository,
    private readonly activityRepo: ActivityRepository,
    private readonly questionRepo: QuestionRepository,
    private readonly attendanceRepo: AttendanceRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.config.get<boolean>('isProduction')) return;

    // All onModuleInit hooks (including AuthRepository) have completed
    const students = await this.studentRepo.findByClassAndBoard('8', 'CBSE');
    if (students.length === 0) {
      this.logger.warn('No test student found — skipping seed');
      return;
    }

    const student = students[0];

    // Check if already seeded (idempotent)
    const existingActivities = await this.activityRepo.findTodayForStudent(student.id);
    if (existingActivities.length > 0) {
      this.logger.log('Dev data already seeded — skipping');
      return;
    }

    this.logger.log('Seeding development data...');

    // 1. Syllabus metadata
    const syllabusEntries = await this.seedSyllabus();

    // 2. Activities + Questions
    await this.seedActivities(student.id, syllabusEntries);

    // 3. Attendance
    await this.seedAttendance(student.id);

    this.logger.log('Development data seeded successfully');
  }

  private async seedSyllabus() {
    const entries = [
      { class: '8', board: 'CBSE', subject: 'Mathematics', chapter: 'Linear Equations', topic: 'One Variable', sortOrder: 1 },
      { class: '8', board: 'CBSE', subject: 'Mathematics', chapter: 'Linear Equations', topic: 'Two Variables', sortOrder: 2 },
      { class: '8', board: 'CBSE', subject: 'Mathematics', chapter: 'Quadrilaterals', topic: 'Types of Quadrilaterals', sortOrder: 3 },
      { class: '8', board: 'CBSE', subject: 'Mathematics', chapter: 'Quadrilaterals', topic: 'Properties', sortOrder: 4 },
      { class: '8', board: 'CBSE', subject: 'Science', chapter: 'Force and Pressure', topic: 'Types of Forces', sortOrder: 1 },
      { class: '8', board: 'CBSE', subject: 'Science', chapter: 'Force and Pressure', topic: 'Pressure in Fluids', sortOrder: 2 },
    ];

    const created = [];
    for (const entry of entries) {
      created.push(await this.syllabusRepo.create(entry));
    }
    this.logger.log(`Seeded ${created.length} syllabus entries`);
    return created;
  }

  private async seedActivities(studentId: string, syllabus: any[]) {
    const mathSyllabus = syllabus[0]; // Linear Equations — One Variable
    const sciSyllabus = syllabus[4]; // Force and Pressure — Types of Forces

    // Activity 1: Math homework (pending)
    const hw = await this.activityRepo.create({
      studentId,
      type: ActivityType.HOMEWORK,
      title: 'Ch 3 — Linear Equations in One Variable',
      syllabusId: mathSyllabus.id,
      status: ActivityStatus.PENDING,
      questionCount: 3,
      estimatedMinutes: 15,
    });

    await this.questionRepo.createMany([
      {
        activityId: hw.id,
        syllabusId: mathSyllabus.id,
        type: QuestionType.MCQ,
        content: 'Solve: 2x + 5 = 13. What is x?',
        options: ['2', '3', '4', '5'],
        correctAnswer: '4',
        difficulty: 2,
        sortOrder: 1,
      },
      {
        activityId: hw.id,
        syllabusId: mathSyllabus.id,
        type: QuestionType.MCQ,
        content: 'If 3y - 7 = 14, find y.',
        options: ['5', '6', '7', '8'],
        correctAnswer: '7',
        difficulty: 2,
        sortOrder: 2,
      },
      {
        activityId: hw.id,
        syllabusId: mathSyllabus.id,
        type: QuestionType.FILL_BLANK,
        content: 'The solution of 5x = 30 is x = ___',
        correctAnswer: '6',
        difficulty: 1,
        sortOrder: 3,
      },
    ]);

    // Activity 2: Science quiz (pending)
    const quiz = await this.activityRepo.create({
      studentId,
      type: ActivityType.QUIZ,
      title: 'Force and Pressure — Quick Quiz',
      syllabusId: sciSyllabus.id,
      status: ActivityStatus.PENDING,
      questionCount: 3,
      estimatedMinutes: 10,
    });

    await this.questionRepo.createMany([
      {
        activityId: quiz.id,
        syllabusId: sciSyllabus.id,
        type: QuestionType.MCQ,
        content: 'Which of the following is a contact force?',
        options: ['Gravity', 'Friction', 'Magnetic force', 'Electrostatic force'],
        correctAnswer: 'Friction',
        difficulty: 1,
        sortOrder: 1,
      },
      {
        activityId: quiz.id,
        syllabusId: sciSyllabus.id,
        type: QuestionType.TRUE_FALSE,
        content: 'Pressure is defined as force per unit area.',
        correctAnswer: 'true',
        difficulty: 1,
        sortOrder: 2,
      },
      {
        activityId: quiz.id,
        syllabusId: sciSyllabus.id,
        type: QuestionType.SHORT_ANSWER,
        content: 'Explain in your own words why a sharp knife cuts better than a blunt one.',
        rubric: 'Must mention pressure = force/area; smaller area means higher pressure; accept synonyms.',
        difficulty: 3,
        sortOrder: 3,
      },
    ]);

    // Activity 3: Gap-bridge (pending, no questions yet — placeholder)
    await this.activityRepo.create({
      studentId,
      type: ActivityType.GAP_BRIDGE,
      title: 'Review: Quadrilateral Properties',
      syllabusId: syllabus[3].id,
      status: ActivityStatus.PENDING,
      questionCount: 0,
      estimatedMinutes: 20,
    });

    this.logger.log('Seeded 3 activities with questions');
  }

  private async seedAttendance(studentId: string) {
    const today = new Date();
    const records = [];
    for (let i = 1; i <= 10; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      records.push({
        studentId,
        date: dateStr,
        status: i % 5 === 0 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT,
        sourceLabel: 'seed',
      });
    }
    await this.attendanceRepo.createMany(records);
    this.logger.log(`Seeded ${records.length} attendance records`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
