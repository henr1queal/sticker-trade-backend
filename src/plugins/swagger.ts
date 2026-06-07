import fp from 'fastify-plugin';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { env } from '../config/env.js';
import { openApiDocument } from '../openapi/document.js';

const swaggerPlugin = fp(async (app) => {
  // Modo estático: só a spec em src/openapi/document.ts (sem merge com rotas Fastify → evita tag "default")
  await app.register(fastifySwagger, {
    mode: 'static',
    specification: {
      document: openApiDocument,
    },
  } as Parameters<typeof app.register>[1]);

  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    staticCSP: true,
  });

  app.log.info(`Documentação OpenAPI: http://${env.HOST === '0.0.0.0' ? '127.0.0.1' : env.HOST}:${env.PORT}/docs`);
});

export default swaggerPlugin;
