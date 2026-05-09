-- Optional scan evidence (screenshot / webshop / social context); no FK to Scan yet.

CREATE TABLE "ScanEvidence" (
    "id" TEXT NOT NULL,
    "scanId" TEXT,
    "url" TEXT,
    "evidenceType" TEXT NOT NULL,
    "imageUrl" TEXT,
    "imageHash" TEXT,
    "sourcePlatform" TEXT,
    "adText" TEXT,
    "detectedText" TEXT,
    "extractedSignals" JSONB,
    "riskDelta" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanEvidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ScanEvidence_url_createdAt_idx" ON "ScanEvidence"("url", "createdAt" DESC);
CREATE INDEX "ScanEvidence_evidenceType_createdAt_idx" ON "ScanEvidence"("evidenceType", "createdAt" DESC);
