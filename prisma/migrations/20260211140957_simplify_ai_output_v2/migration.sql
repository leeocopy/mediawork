/*
  Warnings:

  - You are about to drop the column `brief` on the `post_ai_outputs` table. All the data in the column will be lost.
  - You are about to drop the column `caption` on the `post_ai_outputs` table. All the data in the column will be lost.
  - You are about to drop the column `hashtags` on the `post_ai_outputs` table. All the data in the column will be lost.
  - You are about to drop the column `textForDesign` on the `post_ai_outputs` table. All the data in the column will be lost.
  - You are about to drop the column `visuals` on the `post_ai_outputs` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_post_ai_outputs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "data" TEXT NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "post_ai_outputs_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_post_ai_outputs" ("createdAt", "id", "postId", "updatedAt", "version") SELECT "createdAt", "id", "postId", "updatedAt", "version" FROM "post_ai_outputs";
DROP TABLE "post_ai_outputs";
ALTER TABLE "new_post_ai_outputs" RENAME TO "post_ai_outputs";
CREATE UNIQUE INDEX "post_ai_outputs_postId_key" ON "post_ai_outputs"("postId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
