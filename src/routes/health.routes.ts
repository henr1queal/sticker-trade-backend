import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async (_request, reply) => {
    const checks = await Promise.allSettled([
      app.prisma.$queryRaw`SELECT 1`,
      app.redis.ping(),
    ]);

    const postgresOk = checks[0].status === 'fulfilled';
    const redisOk = checks[1].status === 'fulfilled' && checks[1].value === 'PONG';

    if (!postgresOk || !redisOk) {
      return reply.status(503).send({
        status: 'unavailable',
        postgres: postgresOk ? 'ok' : 'down',
        redis: redisOk ? 'ok' : 'down',
      });
    }

    return reply.send({
      status: 'ok',
      postgres: 'ok',
      redis: 'ok',
    });
  });
}
