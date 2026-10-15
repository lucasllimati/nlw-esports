import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

import { env } from '../env';

import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaBetterSqlite3({ url: env.DATABASE_URL });

// Não logamos queries: os parâmetros podem conter dados pessoais (Discord)
export const prisma = new PrismaClient({
  adapter,
  log: ['warn', 'error'],
});
