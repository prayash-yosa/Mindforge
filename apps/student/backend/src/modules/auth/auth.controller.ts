/**
 * Mindforge Backend — Auth Controller
 *
 * HTTP-only layer for authentication endpoints.
 * Controllers = HTTP only. No business logic.
 * Delegates everything to AuthService.
 *
 * Architecture ref: §5.2 API Endpoints — Auth domain
 * All auth routes are under /v1/auth and are public (no Bearer required).
 *
 * Task 1.2: MPIN verify with rate limiting and request context.
 * Task 1.3: Lockout status and forgot MPIN entry points.
 */

import { Controller, Post, Body, Req, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { VerifyMpinDto } from './dto/verify-mpin.dto';
import { LockoutStatusDto } from './dto/lockout-status.dto';
import { ForgotMpinDto } from './dto/forgot-mpin.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';

@ApiTags('Auth')
@Controller('v1/auth')
@Public() // All auth routes are public (no Bearer required)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /v1/auth/mpin/verify
   *
   * Verify 6-digit MPIN; return JWT token on success.
   * Stricter rate limit: 10 requests per 60 seconds (brute-force protection).
   */
  @Post('mpin/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Verify MPIN and issue session token' })
  @ApiBody({ type: VerifyMpinDto })
  @ApiResponse({ status: 200, description: 'MPIN verified; token issued' })
  @ApiResponse({ status: 400, description: 'Validation error', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid MPIN', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Account locked', type: ErrorResponseDto })
  @ApiResponse({ status: 429, description: 'Rate limited', type: ErrorResponseDto })
  async verifyMpin(@Body() dto: VerifyMpinDto, @Req() req: Request) {
    return this.authService.verifyMpin(dto.mpin, {
      deviceInfo: dto.deviceInfo,
      ip: req.ip ?? req.socket.remoteAddress,
      requestId: (req as any).id ?? '-',
    });
  }

  /**
   * POST /v1/auth/lockout/status
   *
   * Returns current lockout state: locked until timestamp, attempts remaining.
   *
   * Checklist 1.3: "returns current lockout state"
   */
  @Post('lockout/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check lockout status for a student' })
  @ApiBody({ type: LockoutStatusDto })
  @ApiResponse({ status: 200, description: 'Lockout state returned' })
  @ApiResponse({ status: 400, description: 'Validation error', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Account locked', type: ErrorResponseDto })
  async lockoutStatus(@Body() dto: LockoutStatusDto) {
    return this.authService.getLockoutStatus(dto.studentId!);
  }

  /**
   * POST /v1/auth/forgot-mpin
   *
   * Initiates MPIN recovery flow. In v1, endpoint exists and returns 202
   * with documented behavior. Full OTP flow is out of scope for v1.
   *
   * Checklist 1.3: "endpoint exists and returns 202 or documented behavior"
   */
  @Post('forgot-mpin')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Initiate forgot MPIN recovery' })
  @ApiBody({ type: ForgotMpinDto })
  @ApiResponse({ status: 202, description: 'Recovery request accepted' })
  @ApiResponse({ status: 400, description: 'Validation error', type: ErrorResponseDto })
  async forgotMpin(@Body() dto: ForgotMpinDto, @Req() req: Request) {
    return this.authService.initForgotMpin(dto.studentId, dto.contact, {
      requestId: (req as any).id ?? '-',
      ip: req.ip ?? req.socket.remoteAddress,
    });
  }
}
