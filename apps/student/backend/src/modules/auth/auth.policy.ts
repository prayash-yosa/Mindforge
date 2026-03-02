/**
 * Mindforge Backend — Auth Policy
 *
 * Authorization and lockout policies for the auth module.
 * Policies encapsulate business rules separate from service orchestration.
 *
 * Architecture ref: R7 — "Rate limiting, lockout, audit failed attempts"
 * UX ref: "Too many attempts — Try again in 15 minutes"
 * Checklist 1.2: "Rate limiting and lockout policy documented and implemented"
 */

import { Injectable, Logger } from '@nestjs/common';
import { AuthRepository, LockoutRecord } from './auth.repository';

@Injectable()
export class AuthPolicy {
  private readonly logger = new Logger(AuthPolicy.name);

  /**
   * Maximum MPIN attempts before lockout.
   * Architecture ref: R7 — "5 attempts → lockout"
   */
  readonly MAX_ATTEMPTS = 5;

  /**
   * Lockout duration in minutes.
   * UX ref: "Try again in 15 minutes"
   */
  readonly LOCKOUT_DURATION_MINUTES = 15;

  constructor(private readonly authRepository: AuthRepository) {}

  /**
   * Check if a student is currently locked out.
   * Returns lockout details if locked, or null if not locked.
   */
  async checkLockout(studentId: string): Promise<{
    isLocked: boolean;
    lockedUntil?: Date;
    attemptsRemaining?: number;
  }> {
    const lockout = await this.authRepository.getLockoutState(studentId);

    if (!lockout) {
      return { isLocked: false, attemptsRemaining: this.MAX_ATTEMPTS };
    }

    // Check if lockout has expired
    if (lockout.lockedUntil && lockout.lockedUntil > new Date()) {
      return {
        isLocked: true,
        lockedUntil: lockout.lockedUntil,
        attemptsRemaining: 0,
      };
    }

    // Lockout expired — reset
    if (lockout.lockedUntil && lockout.lockedUntil <= new Date()) {
      await this.authRepository.resetLockout(studentId);
      return { isLocked: false, attemptsRemaining: this.MAX_ATTEMPTS };
    }

    // Not locked yet, calculate remaining attempts
    const attemptsRemaining = Math.max(0, this.MAX_ATTEMPTS - lockout.failedAttempts);
    return { isLocked: false, attemptsRemaining };
  }

  /**
   * Record a failed MPIN attempt. Triggers lockout if threshold reached.
   * Returns updated lockout info.
   */
  async recordFailedAttempt(studentId: string): Promise<{
    isLocked: boolean;
    lockedUntil?: Date;
    attemptsRemaining: number;
  }> {
    const record = await this.authRepository.recordFailedAttempt(studentId);

    if (record.failedAttempts >= this.MAX_ATTEMPTS) {
      // Trigger lockout
      const lockedUntil = new Date(
        Date.now() + this.LOCKOUT_DURATION_MINUTES * 60 * 1000,
      );
      await this.authRepository.setLockout(studentId, lockedUntil);

      this.logger.warn(
        `Student ${studentId} locked out until ${lockedUntil.toISOString()} after ${record.failedAttempts} failed attempts`,
      );

      return {
        isLocked: true,
        lockedUntil,
        attemptsRemaining: 0,
      };
    }

    return {
      isLocked: false,
      attemptsRemaining: this.MAX_ATTEMPTS - record.failedAttempts,
    };
  }

  /**
   * Clear lockout state on successful login.
   */
  async clearLockout(studentId: string): Promise<void> {
    await this.authRepository.resetLockout(studentId);
  }
}
