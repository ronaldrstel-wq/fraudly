-- Scan / abuse instrumentation for database-backed rate limits (Vercel-safe).

CREATE TABLE "ScanRateLimitEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "ipHash" VARCHAR(128) NOT NULL,
    "userAgentHash" VARCHAR(128) NOT NULL,
    "abuseKey" VARCHAR(128) NOT NULL,
    "domain" VARCHAR(512) NOT NULL,
    "scanType" VARCHAR(16) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "reason" VARCHAR(256),

    CONSTRAINT "ScanRateLimitEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ScanRateLimitEvent_ipHash_createdAt_idx" ON "ScanRateLimitEvent"("ipHash", "createdAt" DESC);

CREATE INDEX "ScanRateLimitEvent_abuseKey_createdAt_idx" ON "ScanRateLimitEvent"("abuseKey", "createdAt" DESC);

CREATE INDEX "ScanRateLimitEvent_userId_createdAt_idx" ON "ScanRateLimitEvent"("userId", "createdAt" DESC);

CREATE INDEX "ScanRateLimitEvent_createdAt_idx" ON "ScanRateLimitEvent"("createdAt");
