import { PrismaClient } from '@prisma/client'

/**
 * Standard Prisma Client initialization.
 * 
 * Reverted to standard library engine for stability.
 */

const prismaClientSingleton = () => {
    // CRITICAL: During Vercel build (static generation), DATABASE_URL is often missing.
    // If missing, we return a Mock Client to allow the build to pass without crashing.
    // This mock intercepts all calls and returns empty promises.
    // At runtime (on Vercel or locally with .env), DATABASE_URL will be present,
    // so the real client is used.

    if (!process.env.DATABASE_URL) {
        console.warn("WARN: DATABASE_URL is missing. Using Mock Prisma Client for build environment.");

        // Create a recursive proxy that mocks everything
        const createMock = () => new Proxy({}, {
            get: (target, prop) => {
                if (prop === 'then') return undefined; // Not a promise itself
                if (prop === '$connect' || prop === '$disconnect') return () => Promise.resolve();

                // Return a function that returns a promise for query methods
                return (...args: any[]) => {
                    console.log(`[MOCK] Calling prisma.${String(prop)} during build`);
                    return Promise.resolve(null); // Return null for queries
                };
            }
        });

        // The root client proxy
        return new Proxy({}, {
            get: (target, prop) => {
                if (prop === 'then') return undefined;
                if (prop === '$connect' || prop === '$disconnect') return () => Promise.resolve();
                // Accessing a model (e.g. prisma.user)
                return createMock();
            }
        }) as unknown as PrismaClient;
    }

    return new PrismaClient();
}

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = (globalThis as any).prisma ?? prismaClientSingleton();

export { prisma };

if (process.env.NODE_ENV !== 'production') (globalThis as any).prisma = prisma;
