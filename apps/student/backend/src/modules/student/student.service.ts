/**
 * Mindforge Backend — Student Service (Task 2.3)
 *
 * Business logic for student profile, today's plan, and sync status.
 * Services = business logic only. No HTTP, no direct DB access.
 *
 * Checklist 2.3:
 *   [x] Business service for today's plan (stubs OK where not yet implemented)
 *   [x] API layer calls business layer only
 */

import { Injectable, Logger } from '@nestjs/common';
import { StudentRepository } from '../../database/repositories/student.repository';
import { ActivityRepository } from '../../database/repositories/activity.repository';
import { ResponseRepository } from '../../database/repositories/response.repository';
import { StudentNotFoundException } from '../../common/exceptions/domain.exceptions';
import { ActivityStatus } from '../../database/entities/activity.entity';

/** Today's plan response shape */
export interface TodayPlan {
  student: { id: string; displayName: string; class: string; board: string };
  tasks: TaskCard[];
  completedToday: number;
  totalToday: number;
  progressPercent: number;
}

/** Task card for the home screen */
export interface TaskCard {
  id: string;
  type: string;
  title: string;
  syllabusRef?: { subject?: string; chapter?: string; topic?: string };
  questionCount: number;
  estimatedMinutes: number | null;
  status: string;
  score?: number | null;
}

/** Activity type progress entry */
export interface ActivityTypeProgress {
  type: string;
  total: number;
  completed: number;
  averageScore: number | null;
}

/** Student profile shape */
export interface StudentProfile {
  id: string;
  displayName: string;
  class: string;
  board: string;
  school: string | null;
  totalActivitiesCompleted: number;
  progressOverview: ActivityTypeProgress[];
}

/** Sync status shape */
export interface SyncStatus {
  lastSyncAt: string;
  hasConflict: boolean;
  conflictHint?: string;
}

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(
    private readonly studentRepo: StudentRepository,
    private readonly activityRepo: ActivityRepository,
    private readonly responseRepo: ResponseRepository,
  ) {}

  /**
   * Get today's plan for a student.
   * Returns pending/in-progress tasks + completed-today.
   *
   * Architecture ref: §5.2 — "GET /student/today"
   */
  async getTodayPlan(studentId: string): Promise<TodayPlan> {
    const student = await this.studentRepo.findById(studentId);
    if (!student) throw new StudentNotFoundException();

    const activities = await this.activityRepo.findTodayForStudent(studentId);

    const tasks: TaskCard[] = activities.map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      syllabusRef: a.syllabus
        ? { subject: a.syllabus.subject, chapter: a.syllabus.chapter, topic: a.syllabus.topic }
        : undefined,
      questionCount: a.questionCount,
      estimatedMinutes: a.estimatedMinutes,
      status: a.status,
      score: a.score,
    }));

    const completedToday = tasks.filter((t) => t.status === ActivityStatus.COMPLETED).length;
    const totalToday = tasks.length;
    const progressPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

    return {
      student: {
        id: student.id,
        displayName: student.displayName,
        class: student.class,
        board: student.board,
      },
      tasks,
      completedToday,
      totalToday,
      progressPercent,
    };
  }

  /**
   * Get student profile.
   *
   * Architecture ref: §5.2 — "GET /student/profile"
   */
  async getProfile(studentId: string): Promise<StudentProfile> {
    const student = await this.studentRepo.findById(studentId);
    if (!student) throw new StudentNotFoundException();

    const totalCompleted = await this.activityRepo.countCompletedForStudent(studentId);
    const progressOverview = await this.activityRepo.getProgressOverviewForStudent(studentId);

    return {
      id: student.id,
      displayName: student.displayName,
      class: student.class,
      board: student.board,
      school: student.school,
      totalActivitiesCompleted: totalCompleted,
      progressOverview,
    };
  }

  /**
   * Get sync status for a student.
   *
   * Architecture ref: §5.2 — "GET /student/sync/status"
   * Stub — real sync tracking deferred to Sprint 7.
   */
  async getSyncStatus(studentId: string): Promise<SyncStatus> {
    // Stub — no real sync tracking yet
    return {
      lastSyncAt: new Date().toISOString(),
      hasConflict: false,
    };
  }
}
