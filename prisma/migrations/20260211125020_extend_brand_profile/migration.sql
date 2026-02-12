/*
  Warnings:

  - You are about to drop the column `doNotUse` on the `brand_profiles` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "brand_assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_brand_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "products" TEXT NOT NULL,
    "uvp" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#4F46E5',
    "secondaryColor" TEXT,
    "accentColor" TEXT,
    "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
    "fontStyle" TEXT,
    "logoUrl" TEXT,
    "companyDescription" TEXT,
    "tagline" TEXT,
    "websiteUrl" TEXT,
    "socialInstagram" TEXT,
    "socialFacebook" TEXT,
    "socialLinkedin" TEXT,
    "socialTiktok" TEXT,
    "doUseWords" TEXT,
    "dontUseWords" TEXT,
    "emojiUsage" TEXT NOT NULL DEFAULT 'light',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "brand_profiles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_brand_profiles" ("companyId", "createdAt", "id", "industry", "language", "products", "targetAudience", "tone", "updatedAt", "uvp") SELECT "companyId", "createdAt", "id", "industry", "language", "products", "targetAudience", "tone", "updatedAt", "uvp" FROM "brand_profiles";
DROP TABLE "brand_profiles";
ALTER TABLE "new_brand_profiles" RENAME TO "brand_profiles";
CREATE UNIQUE INDEX "brand_profiles_companyId_key" ON "brand_profiles"("companyId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
