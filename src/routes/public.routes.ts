import type { FastifyInstance } from 'fastify';
import { PublicController } from '../controllers/public.controller.js';
import { validateRequest } from '../lib/validate-request.js';
import { targetShortIdParamsSchema } from '../schemas/trade.schemas.js';
import { AlbumService } from '../services/album.service.js';
import { PublicService } from '../services/public.service.js';

export async function publicRoutes(app: FastifyInstance) {
  const albumService = new AlbumService(app.redis);
  const controller = new PublicController(new PublicService(app.prisma, albumService));

  app.get(
    '/:targetShortId/collection',
    {
      preValidation: validateRequest(targetShortIdParamsSchema, 'params'),
    },
    controller.getCollectionByShortId,
  );

  app.get(
    '/:targetShortId',
    {
      preValidation: validateRequest(targetShortIdParamsSchema, 'params'),
    },
    controller.getByShortId,
  );
}
