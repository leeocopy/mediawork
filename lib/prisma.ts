import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma Client
const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

/**
 * Prisma Client initialization.
 * In production/Vercel with Postgres, we usually don't need the custom adapter
 * unless we are specifically targeting an edge runtime or using better-sqlite3.
 * 
 * If DATABASE_URL starts with 'postgres' or 'postgresql', we use the default driver.
 * Otherwise, we fallback to the local/demo SQLite setup.
 */

function getPrismaClient() {
    const isPostgres = process.env.DATABASE_URL?.startsWith('postgres');

    if (isPostgres) {
        return new PrismaClient({
            log: ['error', 'warn'],
        });
    }

    // Default SQLite setup (local dev / demo)
    try {
        const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
        const path = require('path');
        const dbPath = `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`;
        const adapter = new PrismaBetterSqlite3({ url: dbPath });

        return new PrismaClient({
            adapter,
            log: ['error', 'warn'],
        });
    } catch (e) {
        // Fallback for environments where better-sqlite3 isn't available
        return new PrismaClient({
            log: ['error', 'warn'],
        });
    }
}

export const prisma = globalForPrisma.prisma || getPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
