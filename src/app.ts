import Fastify, { type FastifyError } from 'fastify';
import { env } from './config/env.js';
import sensiblePlugin from './plugins/sensible.js';
import prismaPlugin from './plugins/prisma.js';
import redisPlugin from './plugins/redis.js';
import authPlugin from './plugins/auth.js';
import securityPlugin from './plugins/security.js';
import { authRoutes } from './routes/auth.routes.js';
import { albumRoutes } from './routes/album.routes.js';
import { tradeRoutes } from './routes/trade.routes.js';
import { poiRoutes } from './routes/poi.routes.js';
import { stickersRoutes } from './routes/stickers.routes.js';
import { publicRoutes } from './routes/public.routes.js';
import { friendsRoutes } from './routes/friends.routes.js';
import { profileRoutes } from './routes/profile.routes.js';
import { feedbackRoutes } from './routes/feedback.routes.js';
import { adminRoutes } from './routes/admin.routes.js';
import { healthRoutes } from './routes/health.routes.js';
import observabilityPlugin from './plugins/observability.js';
import { resolveClientErrorMessage, resolveClientErrorName } from './lib/safe-error-message.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
    trustProxy: true,
    bodyLimit: 1048576,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
  });

  await app.register(sensiblePlugin);
  await app.register(prismaPlugin);
  await app.register(redisPlugin);
  await app.register(authPlugin);
  await app.register(observabilityPlugin);
  await app.register(securityPlugin);

  await app.register(healthRoutes);

  await app.register(stickersRoutes, { prefix: '/api/stickers' });
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(publicRoutes, { prefix: '/api/public' });
  await app.register(albumRoutes, { prefix: '/api/album' });
  await app.register(tradeRoutes, { prefix: '/api/trade' });
  await app.register(friendsRoutes, { prefix: '/api/friends' });
  await app.register(profileRoutes, { prefix: '/api/profile' });
  await app.register(feedbackRoutes, { prefix: '/api/feedback' });

  if (env.OPS_ROUTE_TOKEN) {
    await app.register(adminRoutes, { prefix: `/api/ops/${env.OPS_ROUTE_TOKEN}` });
  }

  await app.register(poiRoutes, { prefix: '/api/poi' });

  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: 'Recurso não encontrado.',
    });
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error({ err: error }, 'Unhandled error');

    if (reply.sent) {
      return;
    }

    const statusCode = error.statusCode ?? 500;

    reply.status(statusCode).send({
      statusCode,
      error: resolveClientErrorName(error),
      message: resolveClientErrorMessage(error),
    });
  });

  return app;
}
