/**
 * Mindforge Backend — Central Auth Guard (Task 1.4)
 *
 * Validates JWT Bearer token on all protected routes.
 * Routes marked @Public() bypass this guard.
 *
 * Architecture ref: §8 Security — "AuthN: token sent as Bearer"
 *
 * Checklist 1.4:
 *   [x] Middleware validates token/session on all routes except /auth/* and health.
 *   [x] Invalid or expired token → 401 with consistent error shape.
 *   [x] Authenticated student_id available to business layer for scope.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/** Shape of the authenticated student attached to request */
export interface AuthenticatedStudent {
  id: string;
  studentId: string;
  class: string;
  board: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    // ── Check Authorization header ──────────────────────────────
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization token',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization token',
      });
    }

    // ── Verify JWT ──────────────────────────────────────────────
    try {
      const secret = this.configService.get<string>('jwt.secret');
      const payload = await this.jwtService.verifyAsync(token, { secret });

      // Attach authenticated student to request for downstream use
      const student: AuthenticatedStudent = {
        id: payload.sub ?? payload.studentId,
        studentId: payload.studentId ?? payload.sub,
        class: payload.class,
        board: payload.board,
      };

      request.student = student;
      return true;
    } catch (err: any) {
      // Handle specific JWT errors
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          code: 'TOKEN_EXPIRED',
          message: 'Session expired. Please log in again.',
        });
      }

      if (err.name === 'JsonWebTokenError') {
        throw new UnauthorizedException({
          code: 'INVALID_TOKEN',
          message: 'Invalid authorization token',
        });
      }

      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Authorization failed',
      });
    }
  }
}
