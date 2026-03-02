/**
 * Mindforge Backend — JSON-Only Middleware
 *
 * Rejects non-JSON content types on POST/PUT/PATCH requests.
 * Architecture: "JSON request/response"
 */

import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class JsonOnlyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(req.method);
    const hasContent = req.headers['content-length'] && req.headers['content-length'] !== '0';

    if (hasBody && hasContent && !req.is('json') && !req.is('multipart/form-data')) {
      res.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).json({
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'Content-Type must be application/json',
      });
      return;
    }

    next();
  }
}
