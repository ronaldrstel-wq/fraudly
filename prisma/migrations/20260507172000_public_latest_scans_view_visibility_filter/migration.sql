CREATE OR REPLACE VIEW "public_latest_scans_view" AS
SELECT
  rs."id" AS "id",
  rs."normalizedQuery" AS "normalizedValue",
  rs."entityType" AS "entityType",
  COALESCE(rs."verdictSnap", 'unknown') AS "status",
  GREATEST(0, LEAST(100, COALESCE(rs."trustScoreSnap", 65)))::INTEGER AS "score",
  rs."resultPath" AS "publicResultPath",
  rs."createdAt" AS "createdAt"
FROM "RecentSearch" rs
WHERE rs."publicVisible" = true;
