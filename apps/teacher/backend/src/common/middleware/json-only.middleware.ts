import { Injectable, NestMiddleware, UnsupportedMediaTypeException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class JsonOnlyMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(req.method);
    const hasContent = req.headers['content-length'] && parseInt(req.headers['content-length'], 10) > 0;

    if (hasBody && hasContent && !req.is('json') && !req.is('multipart/form-data')) {
      throw new UnsupportedMediaTypeException({
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'Only application/json and multipart/form-data are accepted',
      });
    }

    next();
  }
}
