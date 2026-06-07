import type { PrismaClient } from '@prisma/client';
import type Redis from 'ioredis';
import { enrichStickerCodes } from '../data/sticker-catalog.js';
import { buildEffectiveNeedsKey } from '../lib/trade-needs.js';
import { userDupesKey } from '../lib/redis-keys.js';

const PUBLIC_USER_SELECT = {
  id: true,
  shortId: true,
  name: true,
} as const;

export class TradeService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly redis: Redis,
  ) {}

  async match(currentUserId: string, targetShortId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { shortId: targetShortId },
      select: PUBLIC_USER_SELECT,
    });

    if (!targetUser) {
      throw new NotFoundError('Usuário alvo não encontrado');
    }

    if (targetUser.id === currentUserId) {
      throw new TradeValidationError('Não é possível cruzar o álbum consigo mesmo');
    }

    const myNeedsKey = await buildEffectiveNeedsKey(this.redis, currentUserId);
    const targetNeedsKey = await buildEffectiveNeedsKey(this.redis, targetUser.id);
    const myDupesKey = userDupesKey(currentUserId);
    const targetDupesKey = userDupesKey(targetUser.id);

    const pipeline = this.redis.pipeline();

    pipeline.sinter(myNeedsKey, targetDupesKey);
    pipeline.sinter(myDupesKey, targetNeedsKey);

    const results = await pipeline.exec();

    if (!results) {
      throw new Error('Falha ao executar cruzamento no Redis');
    }

    const iNeedFromThemCodes = extractStringSet(results[0]).sort();
    const theyNeedFromMeCodes = extractStringSet(results[1]).sort();

    return {
      targetShortId: targetUser.shortId,
      targetName: targetUser.name,
      iNeedFromThem: enrichStickerCodes(iNeedFromThemCodes),
      theyNeedFromMe: enrichStickerCodes(theyNeedFromMeCodes),
    };
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class TradeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TradeValidationError';
  }
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
