/*
  Warnings:

  - You are about to drop the column `socialFacebook` on the `brand_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `socialLinkedin` on the `brand_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `socialTiktok` on the `brand_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `post_ai_outputs` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedBy` on the `post_assets` table. All the data in the column will be lost.
  - Added the required column `internalBrief` to the `post_ai_outputs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "post_status_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "oldStatus" TEXT NOT NULL,
    "newStatus" TEXT NOT NULL,
    "byUserId" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "post_status_history_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedBy" TEXT NOT NULL,
    CONSTRAINT "invitations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "invitations_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_brand_guidelines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brandProfileId" TEXT,
    "companyId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "brand_guidelines_brandProfileId_fkey" FOREIGN KEY ("brandProfileId") REFERENCES "brand_profiles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_brand_guidelines" ("companyId", "fileName", "fileUrl", "id", "uploadedAt") SELECT "companyId", "fileName", "fileUrl", "id", "uploadedAt" FROM "brand_guidelines";
DROP TABLE "brand_guidelines";
ALTER TABLE "new_brand_guidelines" RENAME TO "brand_guidelines";
CREATE INDEX "brand_guidelines_companyId_idx" ON "brand_guidelines"("companyId");
CREATE TABLE "new_brand_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "products" TEXT NOT NULL,
    "uvp" TEXT NOT NULL,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "accentColor" TEXT,
    "fontFamily" TEXT,
    "fontStyle" TEXT,
    "logoUrl" TEXT,
    "companyDescription" TEXT,
    "tagline" TEXT,
    "websiteUrl" TEXT,
    "instagramHandle" TEXT,
    "doUseWords" TEXT,
    "dontUseWords" TEXT,
    "emojiUsage" TEXT DEFAULT 'light',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "brand_profiles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_brand_profiles" ("accentColor", "companyDescription", "companyId", "createdAt", "doUseWords", "dontUseWords", "emojiUsage", "fontFamily", "fontStyle", "id", "industry", "instagramHandle", "language", "logoUrl", "primaryColor", "products", "secondaryColor", "tagline", "targetAudience", "tone", "updatedAt", "uvp", "websiteUrl") SELECT "accentColor", "companyDescription", "companyId", "createdAt", "doUseWords", "dontUseWords", "emojiUsage", "fontFamily", "fontStyle", "id", "industry", "instagramHandle", "language", "logoUrl", "primaryColor", "products", "secondaryColor", "tagline", "targetAudience", "tone", "updatedAt", "uvp", "websiteUrl" FROM "brand_profiles";
DROP TABLE "brand_profiles";
ALTER TABLE "new_brand_profiles" RENAME TO "brand_profiles";
CREATE UNIQUE INDEX "brand_profiles_companyId_key" ON "brand_profiles"("companyId");
CREATE TABLE "new_post_ai_outputs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "internalBrief" TEXT NOT NULL,
    "primaryCaption" TEXT,
    "hashtags" TEXT,
    "altText" TEXT,
    "imageIdeas" TEXT,
    "visualSystem" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "post_ai_outputs_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_post_ai_outputs" ("createdAt", "id", "postId", "updatedAt", "version") SELECT "createdAt", "id", "postId", "updatedAt", "version" FROM "post_ai_outputs";
DROP TABLE "post_ai_outputs";
ALTER TABLE "new_post_ai_outputs" RENAME TO "post_ai_outputs";
CREATE UNIQUE INDEX "post_ai_outputs_postId_key" ON "post_ai_outputs"("postId");
CREATE TABLE "new_post_assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "post_assets_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_post_assets" ("fileName", "fileType", "fileUrl", "id", "postId", "uploadedAt", "version") SELECT "fileName", "fileType", "fileUrl", "id", "postId", "uploadedAt", "version" FROM "post_assets";
DROP TABLE "post_assets";
ALTER TABLE "new_post_assets" RENAME TO "post_assets";
CREATE INDEX "post_assets_postId_idx" ON "post_assets"("postId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "post_status_history_postId_idx" ON "post_status_history"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_token_idx" ON "invitations"("token");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_email_companyId_key" ON "invitations"("email", "companyId");

-- CreateIndex
CREATE INDEX "post_reviews_postId_idx" ON "post_reviews"("postId");
