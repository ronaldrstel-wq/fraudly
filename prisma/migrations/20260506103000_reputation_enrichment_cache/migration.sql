-- CreateTable
CREATE TABLE "ReputationEnrichmentCache" (
  "id" TEXT NOT NULL,
  "normalizedDomain" VARCHAR(2048) NOT NULL,
  "provider" VARCHAR(64) NOT NULL DEFAULT 'outscraper',
  "status" VARCHAR(32) NOT NULL,
  "payload" JSONB,
  "fetchError" TEXT,
  "estimatedCostUsd" DOUBLE PRECISION,
  "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ReputationEnrichmentCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReputationEnrichmentCache_normalizedDomain_key" ON "ReputationEnrichmentCache"("normalizedDomain");

-- CreateIndex
CREATE INDEX "ReputationEnrichmentCache_expiresAt_idx" ON "ReputationEnrichmentCache"("expiresAt");
