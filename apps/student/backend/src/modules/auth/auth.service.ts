/**
 * Mindforge Backend — Auth Service
 *
 * Business logic for authentication.
 * Services = business logic only. No HTTP, no direct DB access.
 * Calls repository for data and policy for rules.
 *
 * Task 1.2: MPIN verification and JWT token issuance.
 * Task 1.3: Lockout status and forgot MPIN entry points.
 */

import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { AuthRepository } from './auth.repository';
import { AuthPolicy } from './auth.policy';
import { AuditService } from '../../shared/audit/audit.service';

/** Shape returned on successful login */
export interface LoginResult {
  token: string;
  tokenType: 'Bearer';
  expiresIn: string;
  student: {
    id: string;
    displayName: string;
    class: string;
    board: string;
  };
}

/** Shape returned for lockout status */
export interface LockoutStatusResult {
  isLocked: boolean;
  lockedUntil?: string;
  attemptsRemaining: number;
  maxAttempts: number;
  lockoutDurationMinutes: number;
}

/** Shape returned for forgot MPIN */
export interface ForgotMpinResult {
  status: 'accepted';
  message: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly authPolicy: AuthPolicy,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Verify MPIN and issue JWT token.
   *
   * SECURITY: No MPIN in logs or response. No leak of whether identity exists.
   */
  async verifyMpin(
    mpin: string,
    context: { deviceInfo?: string; ip?: string; requestId: string },
  ): Promise<LoginResult> {
    // Step 1: Find student by MPIN
    const student = await this.authRepository.findStudentByMpinMatch(mpin);

    if (!student) {
      await this.auditService.log({
        requestId: context.requestId,
        action: 'LOGIN_FAILURE',
        ip: context.ip,
        metadata: { reason: 'no_match' },
      });

      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid MPIN. Please try again.',
      });
    }

    // Step 2: Check lockout
    const lockoutStatus = await this.authPolicy.checkLockout(student.id);

    if (lockoutStatus.isLocked) {
      await this.auditService.log({
        requestId: context.requestId,
        action: 'LOGIN_BLOCKED_LOCKOUT',
        studentId: student.id,
        ip: context.ip,
        metadata: { lockedUntil: lockoutStatus.lockedUntil?.toISOString() },
      });

      throw new ForbiddenException({
        code: 'ACCOUNT_LOCKED',
        message: 'Too many failed attempts. Please try again later.',
        details: {
          lockedUntil: lockoutStatus.lockedUntil?.toISOString(),
          attemptsRemaining: 0,
        },
      });
    }

    // Step 3: Clear previous failed attempts on success
    await this.authPolicy.clearLockout(student.id);

    // Step 4: Issue JWT
    const tokenPayload = {
      sub: student.id,
      studentId: student.id,
      class: student.class,
      board: student.board,
    };

    const token = this.jwtService.sign(tokenPayload);

    // Step 5: Record session
    const sessionId = uuidv4();
    await this.authRepository.upsertSession({
      id: sessionId,
      studentId: student.id,
      token,
      deviceInfo: context.deviceInfo,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    // Step 6: Audit success
    await this.auditService.log({
      requestId: context.requestId,
      action: 'LOGIN_SUCCESS',
      studentId: student.id,
      ip: context.ip,
      metadata: { sessionId, deviceInfo: context.deviceInfo },
    });

    this.logger.log(`Login successful for student ${student.id}`);

    return {
      token,
      tokenType: 'Bearer',
      expiresIn: '1h',
      student: {
        id: student.id,
        displayName: student.displayName,
        class: student.class,
        board: student.board,
      },
    };
  }

  // ── Task 1.3: Lockout status ──────────────────────────────────

  /**
   * Get current lockout status for a student.
   *
   * Checklist 1.3:
   *   [x] Returns current lockout state (locked until timestamp, attempts remaining)
   *   [x] API error shape consistent; 403 for lockout
   */
  async getLockoutStatus(studentId: string): Promise<LockoutStatusResult> {
    if (!studentId) {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        message: 'studentId is required to check lockout status',
      });
    }

    // Verify student exists
    const student = await this.authRepository.findStudentById(studentId);
    if (!student) {
      // Return generic "not locked" to avoid leaking whether student exists
      return {
        isLocked: false,
        attemptsRemaining: this.authPolicy.MAX_ATTEMPTS,
        maxAttempts: this.authPolicy.MAX_ATTEMPTS,
        lockoutDurationMinutes: this.authPolicy.LOCKOUT_DURATION_MINUTES,
      };
    }

    const lockoutInfo = await this.authPolicy.checkLockout(studentId);

    return {
      isLocked: lockoutInfo.isLocked,
      lockedUntil: lockoutInfo.lockedUntil?.toISOString(),
      attemptsRemaining: lockoutInfo.attemptsRemaining ?? this.authPolicy.MAX_ATTEMPTS,
      maxAttempts: this.authPolicy.MAX_ATTEMPTS,
      lockoutDurationMinutes: this.authPolicy.LOCKOUT_DURATION_MINUTES,
    };
  }

  // ── Task 1.3: Forgot MPIN ─────────────────────────────────────

  /**
   * Initiate forgot MPIN recovery flow.
   *
   * Checklist 1.3:
   *   [x] Endpoint exists and returns 202 or documented behavior
   *   [x] No full OTP flow required in v1 — returns 202 with message
   *
   * In v1 this is an entry point only. The full OTP/recovery flow
   * will be implemented when the external OTP provider is integrated.
   */
  async initForgotMpin(
    studentId?: string,
    contact?: string,
    context?: { requestId: string; ip?: string },
  ): Promise<ForgotMpinResult> {
    // Audit the recovery request
    await this.auditService.log({
      requestId: context?.requestId ?? '-',
      action: 'FORGOT_MPIN_INITIATED',
      studentId,
      ip: context?.ip,
      metadata: { hasContact: !!contact },
    });

    this.logger.log(`Forgot MPIN initiated${studentId ? ` for student ${studentId}` : ''}`);

    // V1: Return 202 — recovery request accepted, external flow pending
    return {
      status: 'accepted',
      message:
        'Recovery request received. If a matching account exists, instructions will be sent to the registered contact. Please contact your school administrator if you need immediate assistance.',
    };
  }
}
