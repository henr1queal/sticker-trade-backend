import type { PrismaClient } from '@prisma/client';
import type Redis from 'ioredis';
import type { AuthTokenPayload } from '../schemas/auth.schemas.js';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    redis: Redis;
  }

  interface FastifyRequest {
    user: AuthTokenPayload;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthTokenPayload;
    user: AuthTokenPayload;
  }
}

export {};
