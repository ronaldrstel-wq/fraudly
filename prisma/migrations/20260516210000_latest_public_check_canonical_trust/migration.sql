-- Canonical consumer trust fields for latest public snapshots (Phase 2).
ALTER TABLE "LatestPublicCheck" ADD COLUMN IF NOT EXISTS "consumerVerdict" VARCHAR(32);
ALTER TABLE "LatestPublicCheck" ADD COLUMN IF NOT EXISTS "consumerVerdictLabel" VARCHAR(64);
ALTER TABLE "LatestPublicCheck" ADD COLUMN IF NOT EXISTS "consumerVerdictBand" VARCHAR(32);
ALTER TABLE "LatestPublicCheck" ADD COLUMN IF NOT EXISTS "normalizedTrustScore" INTEGER;
ALTER TABLE "LatestPublicCheck" ADD COLUMN IF NOT EXISTS "normalizedRiskScore" INTEGER;
