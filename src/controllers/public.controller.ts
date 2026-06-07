import type { FastifyReply, FastifyRequest } from 'fastify';
import type { TargetShortIdParams } from '../schemas/trade.schemas.js';
import { NotFoundError, PublicService } from '../services/public.service.js';

export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  getByShortId = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as TargetShortIdParams;

    try {
      const user = await this.publicService.getByShortId(params.targetShortId);
      return reply.send(user);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw request.server.httpErrors.notFound(error.message);
      }

      throw error;
    }
  };

  getCollectionByShortId = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as TargetShortIdParams;

    try {
      return reply.send(await this.publicService.getCollectionByShortId(params.targetShortId));
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw request.server.httpErrors.notFound(error.message);
      }

      throw error;
    }
  };
}
