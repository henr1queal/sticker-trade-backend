import type { FastifyInstance } from 'fastify';
import { PoiController } from '../controllers/poi.controller.js';
import { validateRequest } from '../lib/validate-request.js';
import { createPoiBodySchema, nearbyPoiQuerySchema } from '../schemas/poi.schemas.js';
import { GeoLocationService } from '../services/geo-location.service.js';

export async function poiRoutes(app: FastifyInstance) {
  const controller = new PoiController(new GeoLocationService(app.redis));

  app.post(
    '/',
    {
      preValidation: validateRequest(createPoiBodySchema, 'body'),
      preHandler: app.authenticateOps,
    },
    controller.create,
  );

  app.get(
    '/nearby',
    {
      preValidation: validateRequest(nearbyPoiQuerySchema, 'query'),
      preHandler: app.authenticate,
    },
    controller.nearby,
  );
}
