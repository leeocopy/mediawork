import { PrismaClient } from '@prisma/client'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'
import dotenv from 'dotenv'

// Load environment variables for local development and non-Next.js scripts
if (typeof window === 'undefined') {
    dotenv.config()
}

// CRITICAL: Configure Neon to use the 'ws' package for WebSockets
if (typeof window === 'undefined') {
    neonConfig.webSocketConstructor = ws
}

/**
 * Standard Prisma Client initialization for Prisma 7 with Neon HTTP Adapter.
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
        console.log("LOG: Constructing PrismaClient with PrismaNeon (WebSocket) adapter...");

        // Prisma 7 Neon Driver Adapter setup (WebSocket version)
        // Note: PrismaNeon acts as a factory/config holder in recent versions
        const adapter = new PrismaNeon({
            connectionString: process.env.DATABASE_URL
        });

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
