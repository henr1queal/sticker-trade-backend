import type { FastifyInstance } from 'fastify';
import { ProfileController } from '../controllers/profile.controller.js';
import { validateRequest } from '../lib/validate-request.js';
import { updateProfileBodySchema } from '../schemas/profile.schemas.js';
import { ProfileService } from '../services/profile.service.js';

export async function profileRoutes(app: FastifyInstance) {
  const controller = new ProfileController(new ProfileService(app.prisma));

  app.get('/me', { preHandler: app.authenticate }, controller.getMe);

  app.patch(
    '/me',
    {
      preValidation: validateRequest(updateProfileBodySchema, 'body'),
      preHandler: app.authenticate,
    },
    controller.updateMe,
  );
}
