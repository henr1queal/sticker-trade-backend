import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CreatePoiBody, NearbyPoiQuery } from '../schemas/poi.schemas.js';
import { GeoLocationService } from '../services/geo-location.service.js';

export class PoiController {
  constructor(private readonly geoLocationService: GeoLocationService) {}

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as CreatePoiBody;
    const poi = await this.geoLocationService.createPoi(body);
    return reply.status(201).send(poi);
  };

  nearby = async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as NearbyPoiQuery;
    const pois = await this.geoLocationService.findNearby(query);
    return reply.send({ pois });
  };
}
