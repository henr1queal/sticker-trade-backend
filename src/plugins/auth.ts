import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import { env } from '../config/env.js';
import { assertOpsAccess } from '../lib/ops-auth.js';
import { authTokenPayloadSchema } from '../schemas/auth.schemas.js';

const authPlugin = fp(async (app) => {
  await app.register(cookie, {
    secret: env.COOKIE_SECRET,
    hook: 'onRequest',
  });

  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  });

  app.decorate('authenticate', async (request) => {
    try {
      const authHeader = request.headers.authorization;

      if (!authHeader?.startsWith('Bearer ') && request.cookies.access_token) {
        request.headers.authorization = `Bearer ${request.cookies.access_token}`;
      }

      await request.jwtVerify();
      request.user = authTokenPayloadSchema.parse(request.user);
    } catch {
      throw app.httpErrors.unauthorized('Token de autenticação ausente ou inválido');
    }
  });

  app.decorate('authenticateOps', async (request) => {
    await assertOpsAccess(request, app.redis);
  });

  /** @deprecated use authenticateOps */
  app.decorate('authenticateAdmin', async (request) => {
    await assertOpsAccess(request, app.redis);
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: import('fastify').FastifyRequest) => Promise<void>;
    authenticateOps: (request: import('fastify').FastifyRequest) => Promise<void>;
    authenticateAdmin: (request: import('fastify').FastifyRequest) => Promise<void>;
  }
}

export default authPlugin;
