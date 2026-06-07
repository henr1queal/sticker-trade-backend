import type { PrismaClient } from '@prisma/client';
import type { StickerEntryDto } from '../schemas/sticker.schemas.js';
import { AlbumService } from './album.service.js';

const PUBLIC_USER_SELECT = {
  id: true,
  shortId: true,
  name: true,
} as const;

export class PublicService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly albumService: AlbumService,
  ) {}

  async getByShortId(shortId: string) {
    const user = await this.prisma.user.findUnique({
      where: { shortId },
      select: PUBLIC_USER_SELECT,
    });

    if (!user) {
      throw new NotFoundError('Código não encontrado');
    }

    return {
      shortId: user.shortId,
      name: user.name,
    };
  }

  async getCollectionByShortId(shortId: string) {
    const user = await this.prisma.user.findUnique({
      where: { shortId },
      select: PUBLIC_USER_SELECT,
    });

    if (!user) {
      throw new NotFoundError('Código não encontrado');
    }

    const catalog = await this.albumService.getCatalogForUser(user.id);
    const needs = catalog.stickers
      .filter((sticker) => sticker.state === 'need')
      .map(toPublicSticker);
    const dupes = catalog.stickers
      .filter((sticker) => sticker.state === 'dupe')
      .map(toPublicSticker);

    return {
      shortId: user.shortId,
      name: user.name,
      summary: catalog.summary,
      needs,
      dupes,
    };
  }
}

function toPublicSticker(sticker: StickerEntryDto): StickerEntryDto {
  return {
    code: sticker.code,
    type: sticker.type,
    number: sticker.number,
    label: sticker.label,
    playerName: sticker.playerName,
    teamCode: sticker.teamCode,
    teamName: sticker.teamName,
  };
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}
