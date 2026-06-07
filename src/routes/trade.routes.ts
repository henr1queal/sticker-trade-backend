import type { FastifyInstance } from 'fastify';
import { TradeController } from '../controllers/trade.controller.js';
import { validateRequest } from '../lib/validate-request.js';
import { targetShortIdParamsSchema } from '../schemas/trade.schemas.js';
import { TradeService } from '../services/trade.service.js';

export async function tradeRoutes(app: FastifyInstance) {
  const controller = new TradeController(new TradeService(app.prisma, app.redis));

  app.get(
    '/match/:targetShortId',
    {
      preValidation: validateRequest(targetShortIdParamsSchema, 'params'),
      preHandler: app.authenticate,
    },
    controller.match,
  );
}
