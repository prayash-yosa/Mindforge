import { Injectable, Logger } from '@nestjs/common';

export interface AuditEntry {
  action: string;
  actor: string;
  requestId: string;
  details?: Record<string, any>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger('Audit');

  log(entry: AuditEntry): void {
    this.logger.log(
      `[${entry.requestId}] ${entry.actor} -> ${entry.action}` +
      (entry.details ? ` | ${JSON.stringify(entry.details)}` : ''),
    );
  }
}
