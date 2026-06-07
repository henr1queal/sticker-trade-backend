import type { FastifyInstance } from 'fastify';
import { FriendsController } from '../controllers/friends.controller.js';
import { validateRequest } from '../lib/validate-request.js';
import {
  friendRequestIdParamsSchema,
  friendShortIdParamsSchema,
  sendFriendRequestBodySchema,
} from '../schemas/friends.schemas.js';
import { targetShortIdParamsSchema } from '../schemas/trade.schemas.js';
import { FriendsService } from '../services/friends.service.js';
import { TradeService } from '../services/trade.service.js';

export async function friendsRoutes(app: FastifyInstance) {
  const tradeService = new TradeService(app.prisma, app.redis);
  const controller = new FriendsController(new FriendsService(app.prisma, tradeService));

  app.get('/', { preHandler: app.authenticate }, controller.list);

  app.get('/requests', { preHandler: app.authenticate }, controller.listRequests);

  app.get('/requests/incoming/count', { preHandler: app.authenticate }, controller.pendingCount);

  app.get(
    '/relationship/:targetShortId',
    {
      preValidation: validateRequest(targetShortIdParamsSchema, 'params'),
      preHandler: app.authenticate,
    },
    controller.relationship,
  );

  app.post(
    '/requests',
    {
      preValidation: validateRequest(sendFriendRequestBodySchema, 'body'),
      preHandler: app.authenticate,
    },
    controller.sendRequest,
  );

  app.post(
    '/requests/:requestId/accept',
    {
      preValidation: validateRequest(friendRequestIdParamsSchema, 'params'),
      preHandler: app.authenticate,
    },
    controller.accept,
  );

  app.post(
    '/requests/:requestId/reject',
    {
      preValidation: validateRequest(friendRequestIdParamsSchema, 'params'),
      preHandler: app.authenticate,
    },
    controller.reject,
  );

  app.delete(
    '/requests/:requestId',
    {
      preValidation: validateRequest(friendRequestIdParamsSchema, 'params'),
      preHandler: app.authenticate,
    },
    controller.cancel,
  );

  app.get(
    '/:friendShortId',
    {
      preValidation: validateRequest(friendShortIdParamsSchema, 'params'),
      preHandler: app.authenticate,
    },
    controller.detail,
  );

  app.delete(
    '/:friendShortId',
    {
      preValidation: validateRequest(friendShortIdParamsSchema, 'params'),
      preHandler: app.authenticate,
    },
    controller.remove,
  );
}
