import type { FastifyReply, FastifyRequest } from 'fastify';
import type { TargetShortIdParams } from '../schemas/trade.schemas.js';
import {
  NotFoundError,
  TradeService,
  TradeValidationError,
} from '../services/trade.service.js';

export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  match = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as TargetShortIdParams;

    try {
      const match = await this.tradeService.match(
        request.user.sub,
        params.targetShortId,
      );

      return reply.send(match);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw request.server.httpErrors.notFound(error.message);
      }

      if (error instanceof TradeValidationError) {
        throw request.server.httpErrors.badRequest(error.message);
      }

      throw error;
    }
  };
}
