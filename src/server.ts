import { env } from './config/env.js';
import { buildApp } from './app.js';

async function start() {
  const app = await buildApp();

  await app.listen({
    port: env.PORT,
    host: env.HOST,
  });

  app.log.info(`Servidor ouvindo em http://${env.HOST}:${env.PORT}`);

  const shutdown = async (signal: NodeJS.Signals) => {
    app.log.info({ signal }, 'Sinal de encerramento recebido. Iniciando graceful shutdown...');

    try {
      await app.close();
      app.log.info('Servidor encerrado com sucesso');
      process.exit(0);
    } catch (error) {
      app.log.error({ err: error }, 'Falha durante graceful shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

start().catch((error) => {
  console.error('[FATAL] Falha ao iniciar servidor:', error);
  process.exit(1);
});
