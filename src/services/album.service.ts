import type Redis from 'ioredis';
import { enrichStickerCode, getSticker, listCatalog, TEAMS } from '../data/sticker-catalog.js';
import { userDupesKey, userPastedKey } from '../lib/redis-keys.js';
import type { StickerState } from '../schemas/sticker.schemas.js';
import type { CatalogQuery, StickerWithStateDto } from '../schemas/sticker.schemas.js';

export class AlbumService {
  constructor(private readonly redis: Redis) {}

  async getUserStickerSets(userId: string) {
    const pastedKey = userPastedKey(userId);
    const dupesKey = userDupesKey(userId);

    const pipeline = this.redis.pipeline();
    pipeline.smembers(pastedKey);
    pipeline.smembers(dupesKey);

    const results = await pipeline.exec();

    return {
      pasted: new Set(extractStringSet(results?.[0])),
      dupes: new Set(extractStringSet(results?.[1])),
    };
  }

  resolveState(code: string, pasted: Set<string>, dupes: Set<string>): StickerState {
    if (pasted.has(code)) {
      return 'pasted';
    }

    if (dupes.has(code)) {
      return 'dupe';
    }

    return 'need';
  }

  buildSummary(stickers: StickerWithStateDto[]) {
    const summary = {
      total: stickers.length,
      need: 0,
      dupe: 0,
      pasted: 0,
    };

    for (const sticker of stickers) {
      summary[sticker.state] += 1;
    }

    return summary;
  }

  async getCatalogForUser(userId: string, filter: CatalogQuery = {}) {
    const { pasted, dupes } = await this.getUserStickerSets(userId);

    const baseStickers = listCatalog({
      type: filter.type,
      teamCode: filter.team,
    });

    const stickers: StickerWithStateDto[] = baseStickers.map((sticker) => ({
      ...sticker,
      state: this.resolveState(sticker.code, pasted, dupes),
    }));

    const filteredStickers = filter.state
      ? stickers.filter((sticker) => sticker.state === filter.state)
      : stickers;

    const fullSummary = this.buildSummary(
      listCatalog({ type: filter.type, teamCode: filter.team }).map((sticker) => ({
        ...sticker,
        state: this.resolveState(sticker.code, pasted, dupes),
      })),
    );

    return {
      summary: fullSummary,
      teams: TEAMS,
      stickers: filteredStickers,
    };
  }

  async updateStickerState(userId: string, code: string, state: StickerState) {
    const sticker = getSticker(code);

    if (!sticker) {
      throw new AlbumValidationError(`Figurinha inválida: ${code}`);
    }

    const pastedKey = userPastedKey(userId);
    const dupesKey = userDupesKey(userId);
    const pipeline = this.redis.multi();

    if (state === 'need') {
      pipeline.srem(pastedKey, sticker.code);
      pipeline.srem(dupesKey, sticker.code);
    } else if (state === 'pasted') {
      pipeline.sadd(pastedKey, sticker.code);
      pipeline.srem(dupesKey, sticker.code);
    } else {
      pipeline.sadd(dupesKey, sticker.code);
      pipeline.srem(pastedKey, sticker.code);
    }

    await pipeline.exec();

    const { pasted, dupes } = await this.getUserStickerSets(userId);
    const stickerWithState: StickerWithStateDto = {
      ...enrichStickerCode(sticker.code),
      state,
    };

    const allStickers = listCatalog().map((entry) => ({
      ...entry,
      state: this.resolveState(entry.code, pasted, dupes),
    }));

    return {
      sticker: stickerWithState,
      summary: this.buildSummary(allStickers),
    };
  }
}

export class AlbumValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AlbumValidationError';
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
