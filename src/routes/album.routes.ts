import type { FastifyInstance } from 'fastify';
import { AlbumController } from '../controllers/album.controller.js';
import { validateRequest } from '../lib/validate-request.js';
import {
  stickerCodeParamsSchema,
  updateStickerBodySchema,
} from '../schemas/album.schemas.js';
import { AlbumService } from '../services/album.service.js';

export async function albumRoutes(app: FastifyInstance) {
  const controller = new AlbumController(new AlbumService(app.redis));

  app.patch(
    '/:code',
    {
      preValidation: [
        validateRequest(stickerCodeParamsSchema, 'params'),
        validateRequest(updateStickerBodySchema, 'body'),
      ],
      preHandler: app.authenticate,
    },
    controller.updateSticker,
  );
}
