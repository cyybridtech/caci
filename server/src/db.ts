import { PrismaClient } from '@prisma/client';

// Prevent multiple PrismaClient instances in serverless (Vercel cold starts)
// Without this, each function invocation creates a new DB connection → TiDB pool exhaustion
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}
