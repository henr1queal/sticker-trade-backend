import fp from 'fastify-plugin';
import sensible from '@fastify/sensible';

const sensiblePlugin = fp(async (app) => {
  await app.register(sensible);
});

export default sensiblePlugin;
