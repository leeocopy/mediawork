/*
  Warnings:

  - You are about to drop the `brand_assets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `socialInstagram` on the `brand_profiles` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "brand_assets";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "brand_guidelines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    "fontFamily" TEXT,
    "fontStyle" TEXT,
    "logoUrl" TEXT,
    "companyDescription" TEXT,
    "tagline" TEXT,
    "websiteUrl" TEXT,
    "instagramHandle" TEXT,
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
INSERT INTO "new_brand_profiles" ("accentColor", "companyDescription", "companyId", "createdAt", "doUseWords", "dontUseWords", "emojiUsage", "fontFamily", "fontStyle", "id", "industry", "language", "logoUrl", "primaryColor", "products", "secondaryColor", "socialFacebook", "socialLinkedin", "socialTiktok", "tagline", "targetAudience", "tone", "updatedAt", "uvp", "websiteUrl") SELECT "accentColor", "companyDescription", "companyId", "createdAt", "doUseWords", "dontUseWords", "emojiUsage", "fontFamily", "fontStyle", "id", "industry", "language", "logoUrl", "primaryColor", "products", "secondaryColor", "socialFacebook", "socialLinkedin", "socialTiktok", "tagline", "targetAudience", "tone", "updatedAt", "uvp", "websiteUrl" FROM "brand_profiles";
DROP TABLE "brand_profiles";
ALTER TABLE "new_brand_profiles" RENAME TO "brand_profiles";
CREATE UNIQUE INDEX "brand_profiles_companyId_key" ON "brand_profiles"("companyId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "brand_guidelines_companyId_idx" ON "brand_guidelines"("companyId");
