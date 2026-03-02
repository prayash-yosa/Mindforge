/**
 * Mindforge Backend — Domain Exceptions (Task 2.3)
 *
 * Domain-specific exceptions mapped to HTTP status codes and error codes.
 * Used by business layer; caught by GlobalExceptionFilter.
 *
 * Architecture ref: §6 — "Domain exceptions (e.g. InvalidMPIN, LockedOut,
 * ActivityNotFound) mapped to API codes/messages; no stack to client."
 *
 * Checklist 2.3:
 *   [x] Domain exceptions mapped to API codes/messages
 */

import {
  HttpException,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  GoneException,
} from '@nestjs/common';

/** Base for all domain exceptions — carries a machine-readable code */
interface DomainError {
  code: string;
  message: string;
  details?: any;
}

// ── Auth Domain ──────────────────────────────────────────────────

/** MPIN is incorrect */
export class InvalidMpinException extends UnauthorizedException {
  constructor() {
    super({
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid MPIN. Please try again.',
    } as DomainError);
  }
}

/** Account is locked out after too many failed attempts */
export class AccountLockedException extends ForbiddenException {
  constructor(lockedUntil?: string) {
    super({
      code: 'ACCOUNT_LOCKED',
      message: 'Too many failed attempts. Please try again later.',
      details: lockedUntil ? { lockedUntil } : undefined,
    } as DomainError);
  }
}

/** Token is expired */
export class TokenExpiredException extends UnauthorizedException {
  constructor() {
    super({
      code: 'TOKEN_EXPIRED',
      message: 'Session expired. Please log in again.',
    } as DomainError);
  }
}

// ── Activity Domain ──────────────────────────────────────────────

/** Activity not found (or not accessible by the student) */
export class ActivityNotFoundException extends NotFoundException {
  constructor(activityId?: string) {
    super({
      code: 'ACTIVITY_NOT_FOUND',
      message: 'Activity not found or not accessible.',
      details: activityId ? { activityId } : undefined,
    } as DomainError);
  }
}

/** Activity has already been completed */
export class ActivityAlreadyCompletedException extends ConflictException {
  constructor(activityId?: string) {
    super({
      code: 'ACTIVITY_ALREADY_COMPLETED',
      message: 'This activity has already been completed.',
      details: activityId ? { activityId } : undefined,
    } as DomainError);
  }
}

/** Activity has expired (past due date) */
export class ActivityExpiredException extends GoneException {
  constructor(activityId?: string) {
    super({
      code: 'ACTIVITY_EXPIRED',
      message: 'This activity has expired.',
      details: activityId ? { activityId } : undefined,
    } as DomainError);
  }
}

// ── Question Domain ──────────────────────────────────────────────

/** Question not found */
export class QuestionNotFoundException extends NotFoundException {
  constructor(questionId?: string) {
    super({
      code: 'QUESTION_NOT_FOUND',
      message: 'Question not found.',
      details: questionId ? { questionId } : undefined,
    } as DomainError);
  }
}

// ── Doubt Domain ─────────────────────────────────────────────────

/** Doubt thread not found */
export class DoubtThreadNotFoundException extends NotFoundException {
  constructor(threadId?: string) {
    super({
      code: 'DOUBT_THREAD_NOT_FOUND',
      message: 'Doubt thread not found or not accessible.',
      details: threadId ? { threadId } : undefined,
    } as DomainError);
  }
}

// ── Student Domain ───────────────────────────────────────────────

/** Student not found */
export class StudentNotFoundException extends NotFoundException {
  constructor() {
    super({
      code: 'STUDENT_NOT_FOUND',
      message: 'Student not found.',
    } as DomainError);
  }
}

// ── AI Domain ────────────────────────────────────────────────────

/** AI provider timeout or failure */
export class AiUnavailableException extends HttpException {
  constructor() {
    super(
      {
        code: 'AI_UNAVAILABLE',
        message: "Couldn't get AI feedback. Try again or view standard hint.",
      } as DomainError,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
