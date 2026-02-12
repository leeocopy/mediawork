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

    // Use a fallback dummy connection string if DATABASE_URL is missing (e.g., during build)
    const connectionString = process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy";

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
