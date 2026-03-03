/**
 * Mindforge Backend — Teacher Sync Service
 *
 * Fetches attendance from Teacher backend when TEACHER_SERVICE_URL is configured.
 * Enables Student app to show Teacher-marked attendance (synced via UID/externalId).
 *
 * Production: timeout, retry, input validation, no PII in logs.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AttendanceResponse } from './attendance.service';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DATE_RANGE_DAYS = 365;

@Injectable()
export class TeacherSyncService {
  private readonly logger = new Logger(TeacherSyncService.name);
  private readonly baseUrl: string;
  private classId: string;
  private classIds: string[] = [];
  private readonly timeoutMs: number;
  private readonly retryCount: number;
  private classIdResolved = false;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = (this.config.get<string>('teacher.serviceUrl') ?? '').replace(/\/$/, '');
    this.classId = (this.config.get<string>('teacher.classId') ?? '').trim();
    this.timeoutMs = this.config.get<number>('teacher.timeoutMs') ?? 5000;
    this.retryCount = Math.max(0, this.config.get<number>('teacher.retryCount') ?? 1);
  }

  isEnabled(): boolean {
    return !!this.baseUrl;
  }

  /** Resolve class IDs from Teacher. When TEACHER_CLASS_ID is set, use it; else fetch all. */
  private async resolveClassIds(): Promise<string[]> {
    if (this.classId) {
      this.classIdResolved = true;
      return [this.classId];
    }
    if (this.classIdResolved) return this.classIds.length ? this.classIds : [];
    try {
      const url = `${this.baseUrl}/v1/cross-app/classes`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!res.ok) return [];
      const json = (await res.json()) as { success?: boolean; data?: { classes?: { id: string }[] } };
      const ids = (json?.data?.classes ?? []).map((c) => c.id).filter(Boolean);
      if (ids.length) {
        this.classIds = ids;
        this.classIdResolved = true;
        this.logger.log(`Teacher sync: resolved ${ids.length} class(es) from ${this.baseUrl}`);
        return ids;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Teacher sync: could not resolve classes: ${msg}`);
    }
    this.classIdResolved = true;
    return [];
  }

  /**
   * Validate date format (YYYY-MM-DD) and range (max 365 days).
   */
  private validateDateRange(startDate: string, endDate: string): boolean {
    if (!DATE_REGEX.test(startDate) || !DATE_REGEX.test(endDate)) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return false;
    const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return days <= MAX_DATE_RANGE_DAYS;
  }

  /**
   * Sanitize student UID — alphanumeric and common separators only.
   */
  private sanitizeUid(uid: string): string {
    return uid.replace(/[^a-zA-Z0-9_-]/g, '');
  }

  /**
   * Fetch attendance from Teacher backend.
   * Uses student externalId (UID) as studentId for Teacher API.
   * Production: timeout, retry, validation, graceful fallback.
   */
  async fetchAttendance(
    studentUid: string,
    startDate: string,
    endDate: string,
  ): Promise<AttendanceResponse | null> {
    if (!this.baseUrl) return null;
    const classIds = await this.resolveClassIds();
    if (!classIds.length) return null;

    const uid = this.sanitizeUid(studentUid);
    if (!uid) {
      this.logger.warn('Teacher sync: invalid student UID');
      return null;
    }

    if (!this.validateDateRange(startDate, endDate)) {
      this.logger.warn('Teacher sync: invalid date range');
      return null;
    }

    const merged: { date: string; status: string }[] = [];
    const byDate = new Map<string, string>();

    for (const cid of classIds) {
      const result = await this.fetchCalendarForClass(uid, cid, startDate, endDate);
      if (!result) continue;
      for (const entry of result) {
        const current = byDate.get(entry.date);
        if (!current || entry.status === 'absent') {
          byDate.set(entry.date, entry.status);
        }
      }
    }

    if (byDate.size === 0) return null;

    for (const [date, status] of byDate.entries()) {
      merged.push({ date, status });
    }
    merged.sort((a, b) => a.date.localeCompare(b.date));

    const present = merged.filter((e) => e.status === 'present').length;
    const absent = merged.filter((e) => e.status === 'absent').length;
    const total = merged.length;
    const attendancePercent = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      summary: {
        studentId: uid,
        period: { startDate, endDate },
        totalDays: total,
        present,
        absent,
        late: 0,
        attendancePercent,
      },
      calendar: merged,
    };
  }

  private async fetchCalendarForClass(
    studentUid: string,
    classId: string,
    startDate: string,
    endDate: string,
  ): Promise<{ date: string; status: string }[] | null> {
    const url = `${this.baseUrl}/v1/cross-app/attendance/student/${encodeURIComponent(studentUid)}/class/${encodeURIComponent(classId)}/calendar?from=${startDate}&to=${endDate}`;

    for (let attempt = 0; attempt <= this.retryCount; attempt++) {
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        if (!res.ok) {
          if (attempt < this.retryCount) await this.delay(500);
          continue;
        }

        const json = (await res.json()) as { success?: boolean; data?: { calendar?: { date: string; status: string }[] } };
        if (!json.success || !json.data) return null;

        const cal = json.data.calendar ?? [];
        return cal;
      } catch (err: unknown) {
        if (attempt < this.retryCount) await this.delay(500);
      }
    }
    return null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
