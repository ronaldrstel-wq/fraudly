CREATE OR REPLACE VIEW "public_latest_scans_view" AS
SELECT
  rs."id" AS "id",
  rs."normalizedQuery" AS "normalizedValue",
  rs."entityType" AS "entityType",
  COALESCE(rs."verdictSnap", 'unknown') AS "status",
  GREATEST(0, LEAST(100, COALESCE(rs."trustScoreSnap", 65)))::INTEGER AS "score",
  rs."resultPath" AS "publicResultPath",
  rs."createdAt" AS "createdAt"
FROM "RecentSearch" rs;

COMMENT ON VIEW "public_latest_scans_view" IS
'Public-safe contract for the public Latest Checks feed only.
Do not add private or user-identifying fields.
Forbidden examples: userId, email, IP address, anonymousSessionKey, raw scan metadata/results, private notes, session identifiers.
Private dashboard/history must continue using scoped RecentSearch APIs.';

COMMENT ON COLUMN "public_latest_scans_view"."id" IS
'Public scan event identifier for feed rendering.';
COMMENT ON COLUMN "public_latest_scans_view"."normalizedValue" IS
'Public normalized scanned URL/domain string.';
COMMENT ON COLUMN "public_latest_scans_view"."entityType" IS
'Public entity category shown in feed UI.';
COMMENT ON COLUMN "public_latest_scans_view"."status" IS
'Public verdict/status label only.';
COMMENT ON COLUMN "public_latest_scans_view"."score" IS
'Public trust-style score (0-100).';
COMMENT ON COLUMN "public_latest_scans_view"."publicResultPath" IS
'Public path to shareable scan result page.';
COMMENT ON COLUMN "public_latest_scans_view"."createdAt" IS
'Feed ordering timestamp (newest first).';
