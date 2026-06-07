import type { PrismaClient } from '@prisma/client';
import type { UpdateProfileBody } from '../schemas/profile.schemas.js';

function normalizeInstagram(raw?: string): string | null {
  if (!raw?.trim()) {
    return null;
  }

  return raw.trim().replace(/^@+/, '').toLowerCase();
}

function normalizeWhatsapp(raw?: string): string | null {
  if (!raw?.trim()) {
    return null;
  }

  const digits = raw.trim().replace(/\D/g, '');

  if (digits.length < 10 || digits.length > 15) {
    return null;
  }

  return digits.startsWith('55') ? `+${digits}` : `+55${digits}`;
}

export class ProfileService {
  constructor(private readonly prisma: PrismaClient) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        shortId: true,
        name: true,
        profile: true,
      },
    });

    if (!user) {
      throw new ProfileNotFoundError('Usuário não encontrado');
    }

    return {
      shortId: user.shortId,
      name: user.name,
      instagramHandle: user.profile?.instagramHandle ?? null,
      whatsappPhone: user.profile?.whatsappPhone ?? null,
      shareInstagramWithFriends: user.profile?.shareInstagramWithFriends ?? false,
      shareWhatsappWithFriends: user.profile?.shareWhatsappWithFriends ?? false,
    };
  }

  async updateMe(userId: string, input: UpdateProfileBody) {
    const instagramHandle =
      input.instagramHandle !== undefined ? normalizeInstagram(input.instagramHandle) : undefined;
    const whatsappPhone =
      input.whatsappPhone !== undefined ? normalizeWhatsapp(input.whatsappPhone) : undefined;

    if (input.instagramHandle && instagramHandle === null) {
      throw new ProfileValidationError('Instagram inválido');
    }

    if (input.whatsappPhone && whatsappPhone === null) {
      throw new ProfileValidationError('WhatsApp inválido');
    }

    const shareInstagram = input.shareInstagramWithFriends;
    const shareWhatsapp = input.shareWhatsappWithFriends;

    if (shareInstagram && instagramHandle === null && input.instagramHandle !== undefined) {
      throw new ProfileValidationError('Informe o Instagram antes de compartilhar com amigos');
    }

    if (shareWhatsapp && whatsappPhone === null && input.whatsappPhone !== undefined) {
      throw new ProfileValidationError('Informe o WhatsApp antes de compartilhar com amigos');
    }

    await this.prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        instagramHandle: instagramHandle ?? null,
        whatsappPhone: whatsappPhone ?? null,
        shareInstagramWithFriends: shareInstagram ?? false,
        shareWhatsappWithFriends: shareWhatsapp ?? false,
      },
      update: {
        ...(instagramHandle !== undefined ? { instagramHandle } : {}),
        ...(whatsappPhone !== undefined ? { whatsappPhone } : {}),
        ...(shareInstagram !== undefined ? { shareInstagramWithFriends: shareInstagram } : {}),
        ...(shareWhatsapp !== undefined ? { shareWhatsappWithFriends: shareWhatsapp } : {}),
      },
    });

    return this.getMe(userId);
  }
}

export class ProfileNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProfileNotFoundError';
  }
}

export class ProfileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProfileValidationError';
  }
}
