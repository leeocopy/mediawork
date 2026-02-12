import { PrismaClient } from '@prisma/client'

/**
 * Standard Prisma Client initialization.
 * 
 * Reverted to standard library engine for stability.
 */

const prismaClientSingleton = () => {
    // CRITICAL: During Vercel build (static generation), DATABASE_URL is often missing.
    // If missing, inject a dummy value into process.env to allow PrismaClient initialization.
    // The Standard Engine reads process.env.DATABASE_URL automatically.
    // This allows the build to pass validation without connecting.

    if (!process.env.DATABASE_URL) {
        process.env.DATABASE_URL = "postgresql://dummy:dummy@localhost:5432/dummy";
    }

    return new PrismaClient();
}

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = (globalThis as any).prisma ?? prismaClientSingleton();

export { prisma };

if (process.env.NODE_ENV !== 'production') (globalThis as any).prisma = prisma;
