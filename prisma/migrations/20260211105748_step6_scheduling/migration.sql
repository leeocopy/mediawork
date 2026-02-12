-- AlterTable
ALTER TABLE "posts" ADD COLUMN "publishedAt" DATETIME;
ALTER TABLE "posts" ADD COLUMN "publishedUrl" TEXT;
ALTER TABLE "posts" ADD COLUMN "scheduledAt" DATETIME;

-- CreateTable
CREATE TABLE "post_activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "post_activities_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "post_activities_postId_idx" ON "post_activities"("postId");
