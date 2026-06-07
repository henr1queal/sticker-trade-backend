import type Redis from 'ioredis';
import { VALID_STICKER_CODES } from '../data/sticker-catalog.js';
import { userDupesKey, userNeedsKey, userPastedKey } from '../lib/redis-keys.js';

export async function buildEffectiveNeedsKey(redis: Redis, userId: string): Promise<string> {
  const tempKey = `tmp:needs:${userId}`;
  const pastedKey = userPastedKey(userId);
  const dupesKey = userDupesKey(userId);
  const legacyNeedsKey = userNeedsKey(userId);

  const pipeline = redis.pipeline();
  pipeline.smembers(pastedKey);
  pipeline.smembers(dupesKey);
  pipeline.smembers(legacyNeedsKey);

  const results = await pipeline.exec();
  const pasted = new Set(extractStringSet(results?.[0]));
  const dupes = new Set(extractStringSet(results?.[1]));
  const legacyNeeds = extractStringSet(results?.[2]);

  const excluded = new Set([...pasted, ...dupes]);
  const needs = legacyNeeds.length > 0
    ? legacyNeeds.filter((code) => !excluded.has(code))
    : [...VALID_STICKER_CODES].filter((code) => !excluded.has(code));

  await redis.del(tempKey);

  if (needs.length > 0) {
    await redis.sadd(tempKey, ...needs);
    await redis.expire(tempKey, 120);
  }

  return tempKey;
}

function extractStringSet(result: [Error | null, unknown] | undefined): string[] {
  if (!result || result[0]) {
    return [];
  }

  const value = result[1];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}
