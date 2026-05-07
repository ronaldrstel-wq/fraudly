-- CreateEnum
CREATE TYPE "ScamAlertStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateTable
CREATE TABLE "ScamSignal" (
    "id" TEXT NOT NULL,
    "source" VARCHAR(64) NOT NULL,
    "sourceRef" VARCHAR(512),
    "url" VARCHAR(4096),
    "domain" VARCHAR(2048),
    "normalizedDomain" VARCHAR(2048),
    "scamType" VARCHAR(128),
    "affectedBrand" VARCHAR(128),
    "riskLevel" VARCHAR(16) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "firstSeenAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "evidenceJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScamSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScamAlert" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(256) NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "scamType" VARCHAR(128) NOT NULL,
    "affectedBrand" VARCHAR(128),
    "riskLevel" VARCHAR(16) NOT NULL,
    "summary" TEXT NOT NULL,
    "safetyTips" TEXT[],
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "exampleDomainsJson" JSONB,
    "sourceSummaryJson" JSONB,
    "status" "ScamAlertStatus" NOT NULL DEFAULT 'draft',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScamAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScamSignal_source_lastSeenAt_idx" ON "ScamSignal"("source", "lastSeenAt" DESC);

-- CreateIndex
CREATE INDEX "ScamSignal_normalizedDomain_lastSeenAt_idx" ON "ScamSignal"("normalizedDomain", "lastSeenAt" DESC);

-- CreateIndex
CREATE INDEX "ScamSignal_scamType_lastSeenAt_idx" ON "ScamSignal"("scamType", "lastSeenAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ScamSignal_source_sourceRef_key" ON "ScamSignal"("source", "sourceRef");

-- CreateIndex
CREATE UNIQUE INDEX "ScamAlert_slug_key" ON "ScamAlert"("slug");

-- CreateIndex
CREATE INDEX "ScamAlert_status_generatedAt_idx" ON "ScamAlert"("status", "generatedAt" DESC);

-- CreateIndex
CREATE INDEX "ScamAlert_scamType_generatedAt_idx" ON "ScamAlert"("scamType", "generatedAt" DESC);
