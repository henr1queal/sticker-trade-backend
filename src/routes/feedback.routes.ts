import type { FastifyInstance } from 'fastify';
import { FeedbackController } from '../controllers/feedback.controller.js';
import { validateRequest } from '../lib/validate-request.js';
import { createFeedbackBodySchema } from '../schemas/feedback.schemas.js';
import { FeedbackService } from '../services/feedback.service.js';

export async function feedbackRoutes(app: FastifyInstance) {
  const controller = new FeedbackController(new FeedbackService(app.prisma));

  app.post(
    '/',
    {
      preValidation: validateRequest(createFeedbackBodySchema, 'body'),
      preHandler: app.authenticate,
    },
    controller.create,
  );
}
