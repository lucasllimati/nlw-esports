import { existsSync } from 'node:fs';

import { defineConfig } from 'prisma/config';

// O Prisma 7 não carrega mais o .env sozinho
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

// Fallback para o banco local: permite `npm ci` (prisma generate) sem .env
const databaseUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: databaseUrl,
  },
});
