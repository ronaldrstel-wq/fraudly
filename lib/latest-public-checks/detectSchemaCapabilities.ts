import { db } from "@/lib/db";

/** Columns required for canonical trust backfill and list feed alignment. */
export const LATEST_PUBLIC_CHECK_CANONICAL_COLUMNS = [
  "consumerVerdict",
  "consumerVerdictLabel",
  "consumerVerdictBand",
  "normalizedTrustScore",
  "normalizedRiskScore"
] as const;

export const LATEST_PUBLIC_CHECK_PAYLOAD_COLUMN = "publicResultPayload";

export const LATEST_PUBLIC_CHECK_CANONICAL_MIGRATION =
  "20260516210000_latest_public_check_canonical_trust";

export type LatestPublicCheckBackfillMode = "full" | "no_payload" | "legacy";

export type LatestPublicCheckSchemaCapabilities = {
  /** Present columns on LatestPublicCheck (public schema). */
  presentColumns: string[];
  hasPublicResultPayload: boolean;
  hasCanonicalTrustColumns: boolean;
  missingCanonicalColumns: string[];
  backfillSelectMode: LatestPublicCheckBackfillMode;
  /** True when all canonical columns exist — full canonical backfill is allowed. */
  canWriteCanonicalColumns: boolean;
  /** True when at least riskScoreSnapshot can be updated (always true if table exists). */
  canWriteRiskSnapshot: boolean;
  migrationRequired: boolean;
  migrationHint: string | null;
};

function deriveBackfillMode(
  hasPayload: boolean,
  hasCanonical: boolean
): LatestPublicCheckBackfillMode {
  if (hasCanonical && hasPayload) return "full";
  if (hasCanonical) return "no_payload";
  return "legacy";
}

/**
 * Probes Postgres information_schema — safe before Prisma selects/writes missing columns.
 */
export async function detectLatestPublicCheckSchemaCapabilities(): Promise<LatestPublicCheckSchemaCapabilities> {
  const rows = await db.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name::text AS column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'LatestPublicCheck'
  `;

  const present = new Set(rows.map((r) => r.column_name));
  const presentColumns = [...present].sort();

  const missingCanonicalColumns = LATEST_PUBLIC_CHECK_CANONICAL_COLUMNS.filter((c) => !present.has(c));
  const hasCanonicalTrustColumns = missingCanonicalColumns.length === 0;
  const hasPublicResultPayload = present.has(LATEST_PUBLIC_CHECK_PAYLOAD_COLUMN);
  const backfillSelectMode = deriveBackfillMode(hasPublicResultPayload, hasCanonicalTrustColumns);

  const migrationRequired = !hasCanonicalTrustColumns;
  const migrationHint = migrationRequired
    ? `Run \`npx prisma migrate deploy\` on production (migration ${LATEST_PUBLIC_CHECK_CANONICAL_MIGRATION}) before canonical backfill. Until then only riskScoreSnapshot can be updated.`
    : null;

  return {
    presentColumns,
    hasPublicResultPayload,
    hasCanonicalTrustColumns,
    missingCanonicalColumns: [...missingCanonicalColumns],
    backfillSelectMode,
    canWriteCanonicalColumns: hasCanonicalTrustColumns,
    canWriteRiskSnapshot: present.has("riskScoreSnapshot"),
    migrationRequired,
    migrationHint
  };
}
