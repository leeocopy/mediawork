import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

// Singleton pattern for Prisma Client
const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

// Build absolute path to database file
const dbPath = `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`;
const adapter = new PrismaBetterSqlite3({ url: dbPath });

export const prisma = globalForPrisma.prisma || new PrismaClient({
    adapter,
    log: ['error', 'warn'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
