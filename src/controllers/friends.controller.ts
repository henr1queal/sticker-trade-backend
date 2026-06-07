import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  FriendRequestIdParams,
  FriendShortIdParams,
  SendFriendRequestBody,
} from '../schemas/friends.schemas.js';
import type { TargetShortIdParams } from '../schemas/trade.schemas.js';
import {
  FriendsForbiddenError,
  FriendsNotFoundError,
  FriendsService,
  FriendsValidationError,
} from '../services/friends.service.js';

export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send(await this.friendsService.listFriends(request.user.sub));
  };

  listRequests = async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send(await this.friendsService.listRequests(request.user.sub));
  };

  pendingCount = async (request: FastifyRequest, reply: FastifyReply) => {
    const count = await this.friendsService.countIncomingPending(request.user.sub);
    return reply.send({ incomingPending: count });
  };

  relationship = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as TargetShortIdParams;

    try {
      return reply.send(
        await this.friendsService.getRelationship(request.user.sub, params.targetShortId),
      );
    } catch (error) {
      return mapFriendsError(request, error);
    }
  };

  sendRequest = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as SendFriendRequestBody;

    try {
      const result = await this.friendsService.sendRequest(
        request.user.sub,
        body.targetShortId,
      );

      return reply.status(201).send(result);
    } catch (error) {
      return mapFriendsError(request, error);
    }
  };

  accept = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as FriendRequestIdParams;

    try {
      return reply.send(await this.friendsService.acceptRequest(request.user.sub, params.requestId));
    } catch (error) {
      return mapFriendsError(request, error);
    }
  };

  reject = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as FriendRequestIdParams;

    try {
      return reply.send(await this.friendsService.rejectRequest(request.user.sub, params.requestId));
    } catch (error) {
      return mapFriendsError(request, error);
    }
  };

  cancel = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as FriendRequestIdParams;

    try {
      return reply.send(await this.friendsService.cancelRequest(request.user.sub, params.requestId));
    } catch (error) {
      return mapFriendsError(request, error);
    }
  };

  remove = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as FriendShortIdParams;

    try {
      return reply.send(
        await this.friendsService.removeFriend(request.user.sub, params.friendShortId),
      );
    } catch (error) {
      return mapFriendsError(request, error);
    }
  };

  detail = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as FriendShortIdParams;

    try {
      return reply.send(
        await this.friendsService.getFriendDetail(request.user.sub, params.friendShortId),
      );
    } catch (error) {
      return mapFriendsError(request, error);
    }
  };
}

function mapFriendsError(request: FastifyRequest, error: unknown): never {
  if (error instanceof FriendsNotFoundError) {
    throw request.server.httpErrors.notFound(error.message);
  }

  if (error instanceof FriendsValidationError) {
    throw request.server.httpErrors.badRequest(error.message);
  }

  if (error instanceof FriendsForbiddenError) {
    throw request.server.httpErrors.forbidden(error.message);
  }

  throw error;
}
