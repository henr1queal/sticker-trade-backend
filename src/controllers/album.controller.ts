import type { FastifyReply, FastifyRequest } from 'fastify';
import type { StickerCodeParams, UpdateStickerBody } from '../schemas/album.schemas.js';
import { AlbumService, AlbumValidationError } from '../services/album.service.js';

export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}

  updateSticker = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as StickerCodeParams;
    const body = request.body as UpdateStickerBody;

    try {
      const result = await this.albumService.updateStickerState(
        request.user.sub,
        params.code,
        body.state,
      );

      return reply.send(result);
    } catch (error) {
      if (error instanceof AlbumValidationError) {
        throw request.server.httpErrors.badRequest(error.message);
      }

      throw error;
    }
  };
}
