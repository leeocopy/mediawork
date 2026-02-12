import { defineConfig, env } from "prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",
    datasource: {
        // We use the Prisma 7 env() helper. 
        // If it's missing (like during Vercel postinstall), 
        // we provide a valid postgres scheme fallback to satisfy the validator.
        url: env("DATABASE_URL") || "postgresql://dummy:dummy@localhost:5432/dummy",
    },
});
