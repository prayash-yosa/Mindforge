import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RateBucket {
  count: number;
  windowStart: number;
}

@Injectable()
export class AiRateLimiterService {
  private readonly logger = new Logger('AiRateLimit');
  private readonly buckets = new Map<string, RateBucket>();
  private readonly globalBucket: RateBucket = { count: 0, windowStart: Date.now() };

  private readonly perTeacherLimit: number;
  private readonly globalLimit: number;
  private readonly windowMs: number;

  constructor(private readonly config: ConfigService) {
    this.perTeacherLimit = 20; // 20 AI calls per teacher per window
    this.globalLimit = 200; // 200 AI calls globally per window
    this.windowMs = 60 * 60 * 1000; // 1 hour window
  }

  checkLimit(teacherId: string): { allowed: boolean; reason?: string; retryAfterMs?: number } {
    const now = Date.now();

    // Check global limit
    if (now - this.globalBucket.windowStart > this.windowMs) {
      this.globalBucket.count = 0;
      this.globalBucket.windowStart = now;
    }
    if (this.globalBucket.count >= this.globalLimit) {
      const retryAfter = this.windowMs - (now - this.globalBucket.windowStart);
      this.logger.warn(`Global AI rate limit reached (${this.globalLimit}/${this.windowMs}ms)`);
      return { allowed: false, reason: 'GLOBAL_AI_RATE_LIMIT', retryAfterMs: retryAfter };
    }

    // Check per-teacher limit
    let bucket = this.buckets.get(teacherId);
    if (!bucket || now - bucket.windowStart > this.windowMs) {
      bucket = { count: 0, windowStart: now };
      this.buckets.set(teacherId, bucket);
    }
    if (bucket.count >= this.perTeacherLimit) {
      const retryAfter = this.windowMs - (now - bucket.windowStart);
      this.logger.warn(`Teacher ${teacherId.substring(0, 6)}*** AI rate limit reached`);
      return { allowed: false, reason: 'TEACHER_AI_RATE_LIMIT', retryAfterMs: retryAfter };
    }

    // Allow and increment
    bucket.count++;
    this.globalBucket.count++;
    return { allowed: true };
  }

  // Cleanup stale buckets periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.windowStart > this.windowMs * 2) {
        this.buckets.delete(key);
      }
    }
  }
}
