import type { FastifyInstance } from 'fastify';
import { AdminController } from '../controllers/admin.controller.js';
import { validateRequest } from '../lib/validate-request.js';
import {
  adminFeedbackQuerySchema,
  adminLogsQuerySchema,
} from '../schemas/feedback.schemas.js';
import { opsDebugErrorQuerySchema } from '../schemas/ops.schemas.js';
import { AdminObservabilityService } from '../services/admin-observability.service.js';

export async function adminRoutes(app: FastifyInstance) {
  const controller = new AdminController(
    new AdminObservabilityService(app.redis, app.prisma),
  );

  const adminGuard = { preHandler: app.authenticateOps };

  app.get('/metrics', adminGuard, controller.metrics);

  app.get(
    '/logs',
    {
      ...adminGuard,
      preValidation: validateRequest(adminLogsQuerySchema, 'query'),
    },
    controller.logs,
  );

  app.get(
    '/feedback',
    {
      ...adminGuard,
      preValidation: validateRequest(adminFeedbackQuerySchema, 'query'),
    },
    controller.feedback,
  );

  app.get(
    '/debug/error',
    {
      ...adminGuard,
      preValidation: validateRequest(opsDebugErrorQuerySchema, 'query'),
    },
    controller.debugError,
  );
}
