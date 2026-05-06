-- CreateTable
CREATE TABLE "RecentSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "anonymousSessionKey" VARCHAR(64),
    "originalQuery" TEXT NOT NULL,
    "normalizedQuery" VARCHAR(2048) NOT NULL,
    "entityType" VARCHAR(32) NOT NULL,
    "trustScoreSnap" INTEGER,
    "verdictSnap" VARCHAR(32),
    "resultPath" VARCHAR(2048) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecentSearch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecentSearch_userId_createdAt_idx" ON "RecentSearch" ("userId", "createdAt");

-- CreateIndex
CREATE INDEX "RecentSearch_anonymousSessionKey_createdAt_idx" ON "RecentSearch" ("anonymousSessionKey", "createdAt");

-- AddForeignKey
ALTER TABLE "RecentSearch" ADD CONSTRAINT "RecentSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
