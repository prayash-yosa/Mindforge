import { Controller, All, Req, Res, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Stub proxy controller.
 * In production, replace with http-proxy-middleware or a dedicated reverse proxy.
 * Each route prefix maps to a downstream microservice.
 */

const SERVICE_MAP: Record<string, string> = {
  '/api/student': process.env.STUDENT_SERVICE_URL ?? 'http://localhost:3001',
  '/api/parent': process.env.PARENT_SERVICE_URL ?? 'http://localhost:3002',
  '/api/teacher': process.env.TEACHER_SERVICE_URL ?? 'http://localhost:3003',
  '/api/admin': process.env.ADMIN_SERVICE_URL ?? 'http://localhost:3004',
};

@Controller()
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  @All('student/*')
  @All('parent/*')
  @All('teacher/*')
  @All('admin/*')
  handleProxy(@Req() req: Request, @Res() res: Response) {
    const prefix = Object.keys(SERVICE_MAP).find((p) => req.path.startsWith(p));
    const target = prefix ? SERVICE_MAP[prefix] : null;

    if (!target) {
      return res.status(502).json({ code: 'BAD_GATEWAY', message: 'No upstream service configured' });
    }

    this.logger.log(`[PROXY STUB] ${req.method} ${req.path} -> ${target}`);
    return res.status(501).json({
      code: 'NOT_IMPLEMENTED',
      message: `Proxy to ${target} not yet wired. Replace this stub with http-proxy-middleware.`,
    });
  }
}
