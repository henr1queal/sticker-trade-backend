import type { FastifyInstance } from 'fastify';
import { env } from '../config/env.js';
import { AuthController } from '../controllers/auth.controller.js';
import { validateRequest } from '../lib/validate-request.js';
import {
  deleteAccountBodySchema,
  loginBodySchema,
  registerBodySchema,
} from '../schemas/auth.schemas.js';
import { AuthService } from '../services/auth.service.js';

export async function authRoutes(app: FastifyInstance) {
  const controller = new AuthController(new AuthService(app.prisma, app.redis));

  const authRateLimit = {
    rateLimit: {
      max: env.AUTH_RATE_LIMIT_MAX,
      timeWindow: env.AUTH_RATE_LIMIT_TIME_WINDOW_MS,
    },
  };

  app.post(
    '/logout',
    {
      preHandler: app.authenticate,
    },
    controller.logout,
  );

  app.delete(
    '/account',
    {
      preHandler: app.authenticate,
      preValidation: validateRequest(deleteAccountBodySchema, 'body'),
    },
    controller.deleteAccount,
  );

  app.post(
    '/register',
    {
      config: authRateLimit,
      preValidation: validateRequest(registerBodySchema, 'body'),
    },
    controller.register,
  );

  app.post(
    '/login',
    {
      config: authRateLimit,
      preValidation: validateRequest(loginBodySchema, 'body'),
    },
    controller.login,
  );
}
