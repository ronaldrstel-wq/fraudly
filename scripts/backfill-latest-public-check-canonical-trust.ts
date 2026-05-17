/**
 * Backfill canonical trust columns + v2 publicResultPayload on LatestPublicCheck.
 *
 * Usage:
 *   BACKFILL_DRY_RUN=true BACKFILL_BATCH_SIZE=50 npx tsx scripts/backfill-latest-public-check-canonical-trust.ts
 *   BACKFILL_DRY_RUN=false BACKFILL_BATCH_SIZE=100 BACKFILL_MAX_ROWS=500 npx tsx scripts/backfill-latest-public-check-canonical-trust.ts
 *
 * Requires DATABASE_URL. Does not rescan live domains.
 */
import { backfillLatestPublicCheckCanonicalTrust } from "../lib/admin/backfill-latest-public-check-canonical";

function parseBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return defaultValue;
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function main() {
  const dryRun = parseBool(process.env.BACKFILL_DRY_RUN, true);
  const batchSize = parseNumber(process.env.BACKFILL_BATCH_SIZE, 50);
  const maxRowsRaw = process.env.BACKFILL_MAX_ROWS;
  const maxRows = maxRowsRaw ? parseNumber(maxRowsRaw, Number.POSITIVE_INFINITY) : undefined;

  console.log(
    JSON.stringify(
      {
        message: "Starting LatestPublicCheck canonical backfill",
        dryRun,
        batchSize,
        maxRows: maxRows ?? "unlimited"
      },
      null,
      2
    )
  );

  const summary = await backfillLatestPublicCheckCanonicalTrust({
    dryRun,
    batchSize,
    maxRows
  });

  console.log(JSON.stringify(summary, null, 2));

  if (summary.failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error("[backfill:latest-public-check-canonical]", error);
  process.exitCode = 1;
});
