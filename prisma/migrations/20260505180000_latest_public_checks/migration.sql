-- CreateTable
CREATE TABLE "LatestPublicCheck" (
    "id" TEXT NOT NULL,
    "normalizedValue" VARCHAR(2048) NOT NULL,
    "checkedValue" VARCHAR(4096) NOT NULL,
    "entityType" VARCHAR(64) NOT NULL,
    "riskScoreSnapshot" INTEGER NOT NULL,
    "statusLabel" VARCHAR(128) NOT NULL,
    "publicResultPath" VARCHAR(2048) NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LatestPublicCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LatestPublicCheck_normalizedValue_key" ON "LatestPublicCheck"("normalizedValue");

-- CreateIndex
CREATE INDEX "LatestPublicCheck_lastSeenAt_idx" ON "LatestPublicCheck" ("lastSeenAt");
