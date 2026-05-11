import { recalculateRecentScans } from "../lib/admin/recalculate-scans";

function parseBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return defaultValue;
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function main() {
  const limit = parseNumber(process.env.RECALC_LIMIT, 100);
  const sinceDays = parseNumber(process.env.RECALC_SINCE_DAYS, 30);
  const dryRun = parseBool(process.env.RECALC_DRY_RUN, true);
  const force = parseBool(process.env.RECALC_FORCE, false);
  const forceLiveRefresh = parseBool(process.env.RECALC_FORCE_LIVE_REFRESH, false);

  const summary = await recalculateRecentScans({
    limit,
    sinceDays,
    dryRun,
    force,
    forceLiveRefresh
  });

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error("[recalc:scans] failed", error);
  process.exitCode = 1;
});
