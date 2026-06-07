import fp from 'fastify-plugin';
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import {
  normalizeRoutePath,
  type RequestLogEntry,
} from '../lib/observability.js';
import { shouldPersistOpsLog } from '../lib/ops-auth.js';
import {
  OBS_LOG_MAX,
  OBS_LOG_TTL_SECONDS,
  OBS_RECENT_LOGS_KEY,
  obsMetricsKey,
} from '../lib/observability-keys.js';
import { generateUuidV7 } from '../lib/uuid.js';

async function persistErrorLog(
  redis: import('ioredis').default,
  entry: RequestLogEntry,
): Promise<void> {
  const pipeline = redis.pipeline();
  pipeline.lpush(OBS_RECENT_LOGS_KEY, JSON.stringify(entry));
  pipeline.ltrim(OBS_RECENT_LOGS_KEY, 0, OBS_LOG_MAX - 1);
  pipeline.expire(OBS_RECENT_LOGS_KEY, OBS_LOG_TTL_SECONDS);
  await pipeline.exec();
}

const observabilityPlugin = fp(async (app) => {
  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.url.startsWith('/api/')) {
      return;
    }

    const route = normalizeRoutePath(request.url);
    const method = request.method;
    const statusCode = reply.statusCode;
    const durationMs = Math.round(reply.elapsedTime);
    const metricKey = obsMetricsKey(`${method}:${route}`);
    const isServerError = statusCode >= 500;

    const pipeline = app.redis.pipeline();

    pipeline.hincrby(metricKey, 'count', 1);
    pipeline.hincrby(metricKey, 'totalDurationMs', durationMs);
    pipeline.hset(metricKey, 'method', method, 'route', route);

    if (isServerError) {
      pipeline.hincrby(metricKey, 'errorCount', 1);
    }

    if (durationMs > 0) {
      const currentMax = Number((await app.redis.hget(metricKey, 'maxDurationMs')) ?? 0);
      if (durationMs > currentMax) {
        pipeline.hset(metricKey, 'maxDurationMs', String(durationMs));
      }
    }

    const hadThrownError = Boolean(
      (request as FastifyRequest & { error?: unknown }).error,
    );

    if (shouldPersistOpsLog(statusCode) && statusCode < 500 && !hadThrownError) {
      const logEntry: RequestLogEntry = {
        id: generateUuidV7(),
        at: new Date().toISOString(),
        method,
        route,
        statusCode,
        durationMs,
        userId: request.user?.sub,
      };

      pipeline.lpush(OBS_RECENT_LOGS_KEY, JSON.stringify(logEntry));
      pipeline.ltrim(OBS_RECENT_LOGS_KEY, 0, OBS_LOG_MAX - 1);
      pipeline.expire(OBS_RECENT_LOGS_KEY, OBS_LOG_TTL_SECONDS);
    }

    try {
      await pipeline.exec();
    } catch (error) {
      request.log.warn({ err: error }, 'Failed to persist observability data');
    }
  });

  app.addHook('onError', async (request: FastifyRequest, reply: FastifyReply, error: FastifyError) => {
    if (!request.url.startsWith('/api/')) {
      return;
    }

    const statusCode =
      typeof error.statusCode === 'number' ? error.statusCode : 500;

    if (!shouldPersistOpsLog(statusCode)) {
      return;
    }

    const logEntry: RequestLogEntry = {
      id: generateUuidV7(),
      at: new Date().toISOString(),
      method: request.method,
      route: normalizeRoutePath(request.url),
      statusCode,
      durationMs: Math.round(reply.elapsedTime),
      userId: request.user?.sub,
      error: error.message,
    };

    try {
      await persistErrorLog(app.redis, logEntry);
    } catch (persistError) {
      request.log.warn({ err: persistError }, 'Failed to persist error log');
    }
  });
});

export default observabilityPlugin;
