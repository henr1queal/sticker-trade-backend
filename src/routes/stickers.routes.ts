import type { FastifyInstance } from 'fastify';
import { StickersController } from '../controllers/stickers.controller.js';
import { validateRequest } from '../lib/validate-request.js';
import { catalogQuerySchema } from '../schemas/sticker.schemas.js';
import { AlbumService } from '../services/album.service.js';

export async function stickersRoutes(app: FastifyInstance) {
  const albumService = new AlbumService(app.redis);
  const controller = new StickersController(albumService);

  app.get(
    '/catalog',
    {
      preValidation: validateRequest(catalogQuerySchema, 'query'),
      preHandler: app.authenticate,
    },
    controller.catalog,
  );
}
