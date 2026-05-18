-- Idempotent ensure: canonical trust columns for LatestPublicCheck (production repair).
-- Safe when 20260516210000_latest_public_check_canonical_trust already applied.
ALTER TABLE "LatestPublicCheck" ADD COLUMN IF NOT EXISTS "consumerVerdict" VARCHAR(32);
ALTER TABLE "LatestPublicCheck" ADD COLUMN IF NOT EXISTS "consumerVerdictLabel" VARCHAR(64);
ALTER TABLE "LatestPublicCheck" ADD COLUMN IF NOT EXISTS "consumerVerdictBand" VARCHAR(32);
ALTER TABLE "LatestPublicCheck" ADD COLUMN IF NOT EXISTS "normalizedTrustScore" INTEGER;
ALTER TABLE "LatestPublicCheck" ADD COLUMN IF NOT EXISTS "normalizedRiskScore" INTEGER;
