import { env } from './env';

import { prisma } from './lib/prisma';

import { createApp } from './app';

const app = createApp({
  prisma,
  corsOrigins: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean),
  trustProxy: env.TRUST_PROXY,
});

const server = app.listen(env.PORT, () => {
  console.log(`HTTP server running on port ${env.PORT}`);
});

function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
