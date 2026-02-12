import { defineConfig } from "prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",
    datasource: {
        // Using process.env instead of the strict env() helper to prevent 
        // build-time crashes if the variable is missing during install.
        url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres",
    },
});
