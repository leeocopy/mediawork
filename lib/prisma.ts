import { PrismaClient } from '@prisma/client'
import { neon } from '@neondatabase/serverless'
import { PrismaNeonHttp } from '@prisma/adapter-neon'
import dotenv from 'dotenv'

// Load environment variables for local development and non-Next.js scripts
if (typeof window === 'undefined') {
    dotenv.config()
}

/**
 * Standard Prisma Client initialization for Prisma 7 with Neon HTTP Adapter.
 * HTTP Adapter is more stable on Vercel than WebSockets.
 */
const prismaClientSingleton = () => {
    // CRITICAL: During Vercel build (static generation), DATABASE_URL is often missing.
    if (!process.env.DATABASE_URL) {
        console.warn("WARN: DATABASE_URL is missing. Using Mock Prisma Client for build environment.");

        const createMock = () => new Proxy({}, {
            get: (target, prop) => {
                if (prop === 'then') return undefined;
                if (prop === '$connect' || prop === '$disconnect') return () => Promise.resolve();
                return (...args: any[]) => Promise.resolve(null);
            }
        });

        return new Proxy({}, {
            get: (target, prop) => {
                if (prop === 'then') return undefined;
                if (prop === '$connect' || prop === '$disconnect') return () => Promise.resolve();
                return createMock();
            }
        }) as unknown as PrismaClient;
    }

    try {
        console.log("LOG: Constructing PrismaClient with PrismaNeonHttp adapter...");

        const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {} as any);

        const client = new PrismaClient({
            adapter: adapter as any,
            log: ['query', 'info', 'warn', 'error']
        });

        console.log("LOG: PrismaClient successfully constructed");
        return client;
    } catch (e: any) {
        console.error("LOG: PrismaClient construction FAILED:", e.message);
        throw e;
    }
}

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = (globalThis as any).prisma ?? prismaClientSingleton();

export { prisma };

if (process.env.NODE_ENV !== 'production') (globalThis as any).prisma = prisma;
