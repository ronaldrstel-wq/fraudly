-- CreateEnum
CREATE TYPE "ScamAlertStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateTable
CREATE TABLE "ScamAlert" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "slug" VARCHAR(256) NOT NULL,
    "summary" TEXT NOT NULL,
    "scamType" VARCHAR(64) NOT NULL,
    "affectedBrand" VARCHAR(256),
    "domain" VARCHAR(512),
    "url" VARCHAR(2048),
    "sourceName" VARCHAR(128) NOT NULL,
    "sourceUrl" VARCHAR(2048),
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "riskLevel" VARCHAR(32) NOT NULL DEFAULT 'medium',
    "status" "ScamAlertStatus" NOT NULL DEFAULT 'draft',
    "safetyTips" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourceSummaryJson" JSONB,
    "exampleDomainsJson" JSONB,
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "whyRisky" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ScamAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScamSignal" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "sourceName" VARCHAR(128) NOT NULL,
    "sourceUrl" VARCHAR(2048),
    "signalType" VARCHAR(64) NOT NULL,
    "content" TEXT NOT NULL,
    "domain" VARCHAR(512),
    "url" VARCHAR(2048),
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ScamSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScamAlert_slug_key" ON "ScamAlert"("slug");

-- CreateIndex
CREATE INDEX "ScamAlert_status_publishedAt_idx" ON "ScamAlert"("status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "ScamAlert_scamType_status_idx" ON "ScamAlert"("scamType", "status");

-- CreateIndex
CREATE INDEX "ScamAlert_domain_idx" ON "ScamAlert"("domain");

-- CreateIndex
CREATE INDEX "ScamSignal_signalType_sourceName_idx" ON "ScamSignal"("signalType", "sourceName");

-- CreateIndex
CREATE INDEX "ScamSignal_domain_idx" ON "ScamSignal"("domain");

-- CreateIndex
CREATE INDEX "ScamSignal_url_idx" ON "ScamSignal"("url");

-- AddForeignKey
ALTER TABLE "ScamSignal"
ADD CONSTRAINT "ScamSignal_alertId_fkey"
FOREIGN KEY ("alertId")
REFERENCES "ScamAlert"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
