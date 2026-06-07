import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CatalogQuery } from '../schemas/sticker.schemas.js';
import { AlbumService } from '../services/album.service.js';

export class StickersController {
  constructor(private readonly albumService: AlbumService) {}

  catalog = async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as CatalogQuery;
    const catalog = await this.albumService.getCatalogForUser(request.user.sub, query);
    return reply.send(catalog);
  };
}
