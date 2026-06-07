import { timingSafeEqual } from 'node:crypto';
import type Redis from 'ioredis';
import type { FastifyRequest } from 'fastify';
import { env } from '../config/env.js';

const OPS_FAIL_PREFIX = 'ops:fail:';
const OPS_FAIL_MAX = 10;
const OPS_FAIL_WINDOW_SECONDS = 3600;

export function isOpsIpAllowed(request: FastifyRequest): boolean {
  if (env.OPS_ALLOWED_IPS.length === 0) {
    return true;
  }

  return env.OPS_ALLOWED_IPS.includes(request.ip);
}

export async function assertOpsAccess(
  request: FastifyRequest,
  redis: Redis,
): Promise<void> {
  if (!isOpsIpAllowed(request)) {
    throw request.server.httpErrors.notFound();
  }

  const provided = request.headers['x-ops-token'];
  const expected = env.ADMIN_API_KEY;

  if (typeof provided !== 'string' || !secureCompare(provided, expected)) {
    await registerOpsFailure(redis, request.ip);

    if (await isOpsBlocked(redis, request.ip)) {
      throw request.server.httpErrors.tooManyRequests(
        'Muitas tentativas. Tente novamente mais tarde.',
      );
    }

    throw request.server.httpErrors.notFound();
  }
}

async function registerOpsFailure(redis: Redis, ip: string): Promise<void> {
  const key = `${OPS_FAIL_PREFIX}${ip}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, OPS_FAIL_WINDOW_SECONDS);
  }
}

async function isOpsBlocked(redis: Redis, ip: string): Promise<boolean> {
  const count = Number(await redis.get(`${OPS_FAIL_PREFIX}${ip}`));
  return count >= OPS_FAIL_MAX;
}

function secureCompare(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export const OPS_SILENT_HTTP_STATUS = new Set([200, 400, 401, 403]);

export function shouldPersistOpsLog(statusCode: number): boolean {
  return !OPS_SILENT_HTTP_STATUS.has(statusCode);
}
