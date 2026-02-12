import { PrismaClient } from "@prisma/client";

// Singleton pattern for Prisma Client in Next.js
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        // Adding log options makes the constructor "non-empty" 
        // which helps Prisma 7 avoid engine detection errors.
        log: ["error", "warn"],
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
