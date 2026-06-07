import fp from 'fastify-plugin';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { env } from '../config/env.js';
import { openApiDocument } from '../openapi/document.js';

const swaggerPlugin = fp(async (app) => {
  await app.register(fastifySwagger, {
    // Spec estática — cast evita conflito de tipos literais do OpenAPI
    openapi: openApiDocument as Record<string, unknown>,
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      persistAuthorization: true,
    },
    staticCSP: true,
  });

  app.log.info(`Documentação OpenAPI: http://${env.HOST === '0.0.0.0' ? '127.0.0.1' : env.HOST}:${env.PORT}/docs`);
});

export default swaggerPlugin;
