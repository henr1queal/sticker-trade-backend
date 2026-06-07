import type { PrismaClient } from '@prisma/client';
import type Redis from 'ioredis';
import type { EndpointMetric, RequestLogEntry } from '../lib/observability.js';
import {
  OBS_METRICS_PREFIX,
  OBS_RECENT_LOGS_KEY,
} from '../lib/observability-keys.js';

export class AdminObservabilityService {
  constructor(
    private readonly redis: Redis,
    private readonly prisma: PrismaClient,
  ) {}

  async getMetrics(): Promise<EndpointMetric[]> {
    const keys = await this.scanMetricKeys();
    const metrics: EndpointMetric[] = [];

    for (const key of keys) {
      const data = await this.redis.hgetall(key);

      if (!data.route || !data.method) {
        continue;
      }

      const count = Number(data.count ?? 0);
      const totalDurationMs = Number(data.totalDurationMs ?? 0);

      metrics.push({
        route: data.route,
        method: data.method,
        count,
        errorCount: Number(data.errorCount ?? 0),
        totalDurationMs,
        avgDurationMs: count > 0 ? Math.round(totalDurationMs / count) : 0,
        maxDurationMs: Number(data.maxDurationMs ?? 0),
      });
    }

    return metrics.sort((a, b) => b.count - a.count);
  }

  async getRecentLogs(limit = 100): Promise<RequestLogEntry[]> {
    const capped = Math.min(Math.max(limit, 1), 200);
    const raw = await this.redis.lrange(OBS_RECENT_LOGS_KEY, 0, capped - 1);

    return raw
      .map((line) => {
        try {
          return JSON.parse(line) as RequestLogEntry;
        } catch {
          return null;
        }
      })
      .filter((entry): entry is RequestLogEntry => entry !== null);
  }

  async listFeedback(limit = 50) {
    const capped = Math.min(Math.max(limit, 1), 100);

    return this.prisma.userFeedback.findMany({
      take: capped,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            shortId: true,
            name: true,
          },
        },
      },
    });
  }

  private async scanMetricKeys(): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, batch] = await this.redis.scan(
        cursor,
        'MATCH',
        `${OBS_METRICS_PREFIX}*`,
        'COUNT',
        100,
      );

      cursor = nextCursor;
      keys.push(...batch);
    } while (cursor !== '0');

    return keys;
  }
}
