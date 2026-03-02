/**
 * Mindforge Backend — HTTPS Enforcement Middleware
 *
 * Redirects HTTP → HTTPS in production when behind a load balancer.
 * The LB terminates TLS and sets x-forwarded-proto.
 *
 * Checklist 1.1: "REST API layer accepts HTTPS only"
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class HttpsEnforceMiddleware implements NestMiddleware {
  constructor(private readonly config: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const enforceHttps = this.config.get<boolean>('enforceHttps');
    if (!enforceHttps) {
      return next();
    }

    const proto = req.headers['x-forwarded-proto'] ?? req.protocol;
    if (proto !== 'https') {
      res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
      return;
    }

    next();
  }
}
