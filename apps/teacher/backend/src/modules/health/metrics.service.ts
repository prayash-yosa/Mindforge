import { Injectable } from '@nestjs/common';

interface RequestMetric {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  timestamp: number;
}

@Injectable()
export class MetricsService {
  private requestCount = 0;
  private errorCount = 0;
  private aiCallCount = 0;
  private aiErrorCount = 0;
  private aiTotalLatencyMs = 0;
  private readonly recentRequests: RequestMetric[] = [];
  private readonly MAX_RECENT = 1000;
  private readonly startTime = Date.now();

  recordRequest(metric: RequestMetric): void {
    this.requestCount++;
    if (metric.statusCode >= 400) this.errorCount++;
    this.recentRequests.push(metric);
    if (this.recentRequests.length > this.MAX_RECENT) {
      this.recentRequests.shift();
    }
  }

  recordAiCall(durationMs: number, success: boolean): void {
    this.aiCallCount++;
    this.aiTotalLatencyMs += durationMs;
    if (!success) this.aiErrorCount++;
  }

  getSnapshot() {
    const uptimeMs = Date.now() - this.startTime;
    const recent = this.recentRequests;
    const avgLatency =
      recent.length > 0
        ? Math.round(
            recent.reduce((s, r) => s + r.durationMs, 0) / recent.length,
          )
        : 0;

    const p95 = this.percentile(
      recent.map((r) => r.durationMs),
      95,
    );
    const p99 = this.percentile(
      recent.map((r) => r.durationMs),
      99,
    );

    return {
      uptime: {
        ms: uptimeMs,
        human: this.formatUptime(uptimeMs),
      },
      requests: {
        total: this.requestCount,
        errors: this.errorCount,
        errorRate:
          this.requestCount > 0
            ? +(this.errorCount / this.requestCount * 100).toFixed(2)
            : 0,
      },
      latency: {
        avgMs: avgLatency,
        p95Ms: p95,
        p99Ms: p99,
      },
      ai: {
        totalCalls: this.aiCallCount,
        errors: this.aiErrorCount,
        avgLatencyMs:
          this.aiCallCount > 0
            ? Math.round(this.aiTotalLatencyMs / this.aiCallCount)
            : 0,
      },
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      timestamp: new Date().toISOString(),
    };
  }

  private percentile(values: number[], pct: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.ceil((sorted.length * pct) / 100) - 1;
    return sorted[Math.max(0, idx)];
  }

  private formatUptime(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h ${m % 60}m`;
    if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
    return `${m}m ${s % 60}s`;
  }
}
