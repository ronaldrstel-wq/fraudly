-- Lifecycle fields + backfill for published alerts (safe additive migration).

ALTER TABLE "ScamAlert" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
ALTER TABLE "ScamAlert" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

-- Ensure published rows have a publish timestamp for retention and UI.
UPDATE "ScamAlert"
SET "publishedAt" = COALESCE("publishedAt", "lastSeenAt", "createdAt")
WHERE status = 'published' AND "publishedAt" IS NULL;

-- Default visibility window: 90 days from first known publish time.
UPDATE "ScamAlert"
SET "expiresAt" = "publishedAt" + interval '90 days'
WHERE status = 'published' AND "publishedAt" IS NOT NULL AND "expiresAt" IS NULL;

CREATE INDEX IF NOT EXISTS "ScamAlert_status_archivedAt_idx" ON "ScamAlert"("status", "archivedAt" DESC);
