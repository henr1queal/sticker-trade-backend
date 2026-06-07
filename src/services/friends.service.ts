import type { PrismaClient } from '@prisma/client';
import { normalizeFriendPair } from '../lib/friendship.js';
import { generateUuidV7 } from '../lib/uuid.js';
import type { TradeService } from './trade.service.js';

const USER_PREVIEW_SELECT = {
  id: true,
  shortId: true,
  name: true,
} as const;

export class FriendsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly tradeService: TradeService,
  ) {}

  async listFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: { select: USER_PREVIEW_SELECT },
        userB: { select: USER_PREVIEW_SELECT },
      },
      orderBy: { createdAt: 'desc' },
    });

    return friendships.map((friendship) => {
      const friend = friendship.userAId === userId ? friendship.userB : friendship.userA;

      return {
        shortId: friend.shortId,
        name: friend.name,
        friendsSince: friendship.createdAt.toISOString(),
      };
    });
  }

  async countIncomingPending(userId: string): Promise<number> {
    return this.prisma.friendRequest.count({
      where: {
        toUserId: userId,
        status: 'PENDING',
      },
    });
  }

  async listRequests(userId: string) {
    const [incoming, outgoing] = await Promise.all([
      this.prisma.friendRequest.findMany({
        where: { toUserId: userId, status: 'PENDING' },
        include: { fromUser: { select: USER_PREVIEW_SELECT } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.friendRequest.findMany({
        where: { fromUserId: userId, status: 'PENDING' },
        include: { toUser: { select: USER_PREVIEW_SELECT } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return [
      ...incoming.map((request) => ({
        id: request.id,
        shortId: request.fromUser.shortId,
        name: request.fromUser.name,
        status: request.status,
        direction: 'incoming' as const,
        createdAt: request.createdAt.toISOString(),
      })),
      ...outgoing.map((request) => ({
        id: request.id,
        shortId: request.toUser.shortId,
        name: request.toUser.name,
        status: request.status,
        direction: 'outgoing' as const,
        createdAt: request.createdAt.toISOString(),
      })),
    ];
  }

  async getRelationship(userId: string, targetShortId: string) {
    const target = await this.prisma.user.findUnique({
      where: { shortId: targetShortId },
      select: USER_PREVIEW_SELECT,
    });

    if (!target) {
      throw new FriendsNotFoundError('Usuário não encontrado');
    }

    if (target.id === userId) {
      return {
        target,
        status: 'self' as const,
        requestId: null,
      };
    }

    const isFriend = await this.areFriends(userId, target.id);

    if (isFriend) {
      return {
        target,
        status: 'friends' as const,
        requestId: null,
      };
    }

    const pending = await this.prisma.friendRequest.findFirst({
      where: {
        status: 'PENDING',
        OR: [
          { fromUserId: userId, toUserId: target.id },
          { fromUserId: target.id, toUserId: userId },
        ],
      },
    });

    if (pending) {
      return {
        target,
        status: pending.fromUserId === userId ? ('outgoing_pending' as const) : ('incoming_pending' as const),
        requestId: pending.id,
      };
    }

    return {
      target,
      status: 'none' as const,
      requestId: null,
    };
  }

  async sendRequest(fromUserId: string, targetShortId: string) {
    const target = await this.prisma.user.findUnique({
      where: { shortId: targetShortId },
      select: USER_PREVIEW_SELECT,
    });

    if (!target) {
      throw new FriendsNotFoundError('Usuário não encontrado');
    }

    if (target.id === fromUserId) {
      throw new FriendsValidationError('Você não pode adicionar a si mesmo');
    }

    if (await this.areFriends(fromUserId, target.id)) {
      throw new FriendsValidationError('Vocês já são amigos');
    }

    const incomingPending = await this.prisma.friendRequest.findFirst({
      where: {
        status: 'PENDING',
        fromUserId: target.id,
        toUserId: fromUserId,
      },
    });

    if (incomingPending) {
      throw new FriendsValidationError('Esta pessoa já enviou uma solicitação para você');
    }

    const outgoingExisting = await this.prisma.friendRequest.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId,
          toUserId: target.id,
        },
      },
    });

    if (outgoingExisting) {
      if (outgoingExisting.status === 'PENDING') {
        throw new FriendsValidationError('Solicitação já enviada');
      }

      if (outgoingExisting.status === 'ACCEPTED') {
        throw new FriendsValidationError('Vocês já são amigos');
      }

      const request = await this.prisma.friendRequest.update({
        where: { id: outgoingExisting.id },
        data: { status: 'PENDING' },
      });

      return {
        id: request.id,
        shortId: target.shortId,
        name: target.name,
        status: request.status,
        direction: 'outgoing' as const,
        createdAt: request.createdAt.toISOString(),
      };
    }

    const request = await this.prisma.friendRequest.create({
      data: {
        id: generateUuidV7(),
        fromUserId,
        toUserId: target.id,
      },
    });

    return {
      id: request.id,
      shortId: target.shortId,
      name: target.name,
      status: request.status,
      direction: 'outgoing' as const,
      createdAt: request.createdAt.toISOString(),
    };
  }

  async acceptRequest(userId: string, requestId: string) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.toUserId !== userId) {
      throw new FriendsNotFoundError('Solicitação não encontrada');
    }

    if (request.status !== 'PENDING') {
      throw new FriendsValidationError('Esta solicitação não está mais pendente');
    }

    const pair = normalizeFriendPair(request.fromUserId, request.toUserId);

    await this.prisma.$transaction([
      this.prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' },
      }),
      this.prisma.friendship.create({
        data: {
          id: generateUuidV7(),
          ...pair,
        },
      }),
    ]);

    return { ok: true };
  }

  async rejectRequest(userId: string, requestId: string) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.toUserId !== userId) {
      throw new FriendsNotFoundError('Solicitação não encontrada');
    }

    if (request.status !== 'PENDING') {
      throw new FriendsValidationError('Esta solicitação não está mais pendente');
    }

    await this.prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });

    return { ok: true };
  }

  async cancelRequest(userId: string, requestId: string) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.fromUserId !== userId) {
      throw new FriendsNotFoundError('Solicitação não encontrada');
    }

    if (request.status !== 'PENDING') {
      throw new FriendsValidationError('Esta solicitação não está mais pendente');
    }

    await this.prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
    });

    return { ok: true };
  }

  async removeFriend(userId: string, friendShortId: string) {
    const friend = await this.prisma.user.findUnique({
      where: { shortId: friendShortId },
      select: { id: true },
    });

    if (!friend) {
      throw new FriendsNotFoundError('Amigo não encontrado');
    }

    const pair = normalizeFriendPair(userId, friend.id);

    const deleted = await this.prisma.friendship.deleteMany({
      where: {
        userAId: pair.userAId,
        userBId: pair.userBId,
      },
    });

    if (deleted.count === 0) {
      throw new FriendsNotFoundError('Amizade não encontrada');
    }

    return { ok: true };
  }

  async getFriendDetail(userId: string, friendShortId: string) {
    const friend = await this.prisma.user.findUnique({
      where: { shortId: friendShortId },
      select: {
        ...USER_PREVIEW_SELECT,
        profile: true,
      },
    });

    if (!friend) {
      throw new FriendsNotFoundError('Amigo não encontrado');
    }

    if (friend.id === userId) {
      throw new FriendsValidationError('Use seu perfil para ver seus próprios dados');
    }

    const isFriend = await this.areFriends(userId, friend.id);

    if (!isFriend) {
      throw new FriendsForbiddenError('Dados disponíveis apenas para amigos');
    }

    const match = await this.tradeService.match(userId, friendShortId);

    return {
      shortId: friend.shortId,
      name: friend.name,
      instagram:
        friend.profile?.shareInstagramWithFriends && friend.profile.instagramHandle
          ? `@${friend.profile.instagramHandle}`
          : null,
      whatsapp:
        friend.profile?.shareWhatsappWithFriends && friend.profile.whatsappPhone
          ? friend.profile.whatsappPhone
          : null,
      iNeedFromThem: match.iNeedFromThem,
      theyNeedFromMe: match.theyNeedFromMe,
    };
  }

  private async areFriends(userId: string, otherUserId: string): Promise<boolean> {
    const pair = normalizeFriendPair(userId, otherUserId);

    const friendship = await this.prisma.friendship.findUnique({
      where: {
        userAId_userBId: {
          userAId: pair.userAId,
          userBId: pair.userBId,
        },
      },
    });

    return Boolean(friendship);
  }
}

export class FriendsNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FriendsNotFoundError';
  }
}

export class FriendsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FriendsValidationError';
  }
}

export class FriendsForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FriendsForbiddenError';
  }
}
