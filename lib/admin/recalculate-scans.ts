import { db } from "../db";
import { publicStatusLabelForVerdict } from "../latest-public-checks/status-label";
import { runWebsiteAnalysis } from "../analysis/runWebsiteAnalysis";
import { clampScore, verdictFromAssessment } from "../trustSystem";

export type RecalculateScansOptions = {
  limit?: number;
  sinceDays?: number;
  dryRun?: boolean;
  force?: boolean;
  forceLiveRefresh?: boolean;
  batchSize?: number;
};

type RowChange = {
  table: "latestPublicCheck" | "recentSearch";
  id: string;
  key: string;
  oldScore: number | null;
  newScore: number | null;
  oldVerdict: string | null;
  newVerdict: string | null;
  skipped?: string;
};

export type RecalculateScansSummary = {
  ok: true;
  options: Required<Pick<RecalculateScansOptions, "limit" | "sinceDays" | "dryRun" | "force" | "forceLiveRefresh" | "batchSize">>;
  found: number;
  recalculated: number;
  skipped: number;
  errors: number;
  latestPublicChecksUpdated: number;
  recentSearchesUpdated: number;
  changes: RowChange[];
  errorRows: Array<{ table: "latestPublicCheck" | "recentSearch"; id: string; key: string; reason: string }>;
};

function normalizeOptions(options: RecalculateScansOptions) {
  const limit = Math.max(1, Math.min(500, Math.floor(options.limit ?? 100)));
  const sinceDays = Math.max(1, Math.min(365, Math.floor(options.sinceDays ?? 30)));
  const dryRun = options.dryRun !== false;
  const force = options.force === true;
  const forceLiveRefresh = options.forceLiveRefresh === true;
  const batchSize = Math.max(10, Math.min(100, Math.floor(options.batchSize ?? 100)));
  return { limit, sinceDays, dryRun, force, forceLiveRefresh, batchSize };
}

function verdictFromRiskSnapshot(riskScore: number): "safe" | "suspicious" | "scam" {
  return verdictFromAssessment({
    riskScore: clampScore(riskScore),
    confirmedMalicious: false
  });
}

export async function recalculateRecentScans(options: RecalculateScansOptions = {}): Promise<RecalculateScansSummary> {
  const normalized = normalizeOptions(options);
  const sinceDate = new Date(Date.now() - normalized.sinceDays * 24 * 60 * 60 * 1000);
  const changes: RowChange[] = [];
  const errorRows: RecalculateScansSummary["errorRows"] = [];
  let recalculated = 0;
  let skipped = 0;
  let latestPublicChecksUpdated = 0;
  let recentSearchesUpdated = 0;

  const latestRows = await db.latestPublicCheck.findMany({
    where: { lastSeenAt: { gte: sinceDate } },
    orderBy: { lastSeenAt: "desc" },
    take: normalized.limit
  });

  const remaining = Math.max(0, normalized.limit - latestRows.length);
  const recentRows =
    remaining > 0
      ? await db.recentSearch.findMany({
          where: { createdAt: { gte: sinceDate } },
          orderBy: { createdAt: "desc" },
          take: remaining
        })
      : [];

  const totalFound = latestRows.length + recentRows.length;
  console.info("[admin/recalculate-scans] loaded rows", {
    latestRows: latestRows.length,
    recentRows: recentRows.length,
    totalFound,
    dryRun: normalized.dryRun,
    force: normalized.force,
    forceLiveRefresh: normalized.forceLiveRefresh
  });

  for (let i = 0; i < latestRows.length; i += 1) {
    const row = latestRows[i];
    try {
      const oldRisk = clampScore(row.riskScoreSnapshot);
      const oldVerdict = verdictFromRiskSnapshot(oldRisk);
      let newRisk = oldRisk;
      let newVerdict = oldVerdict;
      let newStatusLabel = row.statusLabel;

      if (normalized.forceLiveRefresh) {
        const fresh = await runWebsiteAnalysis(row.normalizedValue, "en");
        newRisk = clampScore(fresh.score);
        newVerdict = fresh.verdict;
      } else {
        newVerdict = verdictFromRiskSnapshot(oldRisk);
      }
      newStatusLabel = publicStatusLabelForVerdict(newVerdict);
      const changed = oldRisk !== newRisk || row.statusLabel !== newStatusLabel;
      if (!changed && !normalized.force) {
        skipped += 1;
        changes.push({
          table: "latestPublicCheck",
          id: row.id,
          key: row.normalizedValue,
          oldScore: oldRisk,
          newScore: newRisk,
          oldVerdict,
          newVerdict,
          skipped: "unchanged"
        });
        continue;
      }
      if (!normalized.dryRun) {
        await db.latestPublicCheck.update({
          where: { id: row.id },
          data: {
            riskScoreSnapshot: newRisk,
            statusLabel: newStatusLabel
          }
        });
      }
      latestPublicChecksUpdated += 1;
      recalculated += 1;
      changes.push({
        table: "latestPublicCheck",
        id: row.id,
        key: row.normalizedValue,
        oldScore: oldRisk,
        newScore: newRisk,
        oldVerdict,
        newVerdict
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      errorRows.push({ table: "latestPublicCheck", id: row.id, key: row.normalizedValue, reason });
      console.error("[admin/recalculate-scans] latest row failed", { id: row.id, key: row.normalizedValue, reason });
    }
  }

  for (let i = 0; i < recentRows.length; i += 1) {
    const row = recentRows[i];
    try {
      const oldTrust = row.trustScoreSnap == null ? null : clampScore(row.trustScoreSnap);
      const trust = oldTrust ?? 50;
      const newVerdict = verdictFromAssessment({
        riskScore: clampScore(100 - trust),
        confirmedMalicious: false
      });
      const changed = row.verdictSnap !== newVerdict || row.trustScoreSnap !== trust;
      if (!changed && !normalized.force) {
        skipped += 1;
        changes.push({
          table: "recentSearch",
          id: row.id,
          key: row.normalizedQuery,
          oldScore: oldTrust,
          newScore: trust,
          oldVerdict: row.verdictSnap,
          newVerdict,
          skipped: "unchanged"
        });
        continue;
      }
      if (!normalized.dryRun) {
        await db.recentSearch.update({
          where: { id: row.id },
          data: {
            trustScoreSnap: trust,
            verdictSnap: newVerdict
          }
        });
      }
      recentSearchesUpdated += 1;
      recalculated += 1;
      changes.push({
        table: "recentSearch",
        id: row.id,
        key: row.normalizedQuery,
        oldScore: oldTrust,
        newScore: trust,
        oldVerdict: row.verdictSnap,
        newVerdict
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      errorRows.push({ table: "recentSearch", id: row.id, key: row.normalizedQuery, reason });
      console.error("[admin/recalculate-scans] recent row failed", { id: row.id, key: row.normalizedQuery, reason });
    }
  }

  return {
    ok: true,
    options: normalized,
    found: totalFound,
    recalculated,
    skipped,
    errors: errorRows.length,
    latestPublicChecksUpdated,
    recentSearchesUpdated,
    changes,
    errorRows
  };
}
