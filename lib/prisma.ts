import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

/**
 * Prisma Client initialization using Neon Driver Adapter.
 * This is the recommended approach for Prisma 7 + Neon.
 */

const prismaClientSingleton = () => {
    // Configure WebSocket for Node.js environment
    if (typeof window === 'undefined') {
        neonConfig.webSocketConstructor = ws;
    }

    // CRITICAL: During Vercel build (Collecting page data), DATABASE_URL is often missing.
    // We must provide a fallback for the BUILD phase to pass.
    // The runtime connection will fail later if valid creds aren't present, which is expected.
    const connectionString = process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy";

    // Minimal runtime log to confirm loading
    const startOfUrl = process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 10) : 'N/A';
    console.log("[PRISMA] DATABASE_URL present:", !!process.env.DATABASE_URL, "length:", process.env.DATABASE_URL?.length, "Starts with:", startOfUrl);

    if (!process.env.DATABASE_URL) {
        console.warn("[PRISMA] WARN: DATABASE_URL is missing. Falling back to dummy connection string. DB queries will fail if this is runtime.");
    }

    if (!connectionString) {
        throw new Error("DATABASE_URL missing at runtime");
    }

    const pool = new Pool({ connectionString });

    // Use the neon driver adapter
    const adapter = new PrismaNeon(pool as any);

    return new PrismaClient({ adapter });
}

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = (globalThis as any).prisma ?? prismaClientSingleton();

export { prisma };

if (process.env.NODE_ENV !== 'production') (globalThis as any).prisma = prisma;
