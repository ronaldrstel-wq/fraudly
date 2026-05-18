import { normalizeDomain } from "@/lib/cache";
import { db } from "@/lib/db";
import {
  alignNormalizedTrustToCanonical,
  buildCanonicalTrustFieldsFromResult,
  buildNormalizedTrustFromLegacyResult,
  buildPublicResultPayloadV2,
  parsePublicResultPayload,
  PUBLIC_RESULT_PAYLOAD_SCHEMA_VERSION
} from "@/lib/trust/canonicalTrustBridge";
import { normalizeRiskScore } from "@/lib/scoring/displayScore";
import { resolveCanonicalFromPersistedColumns } from "@/lib/trust/resolveCanonicalDisplay";
import type { ScamVerdict } from "@/types/scam";
import { Prisma } from "@prisma/client";

const SCORE_TOLERANCE = 1;

export type BackfillRowInput = {
  id: string;
  normalizedValue: string;
  riskScoreSnapshot: number;
  statusLabel: string;
  publicResultPayload?: unknown;
  consumerVerdict?: string | null;
  consumerVerdictLabel?: string | null;
  consumerVerdictBand?: string | null;
  normalizedTrustScore?: number | null;
  normalizedRiskScore?: number | null;
};

export type BackfillRowPlan = {
  id: string;
  domain: string;
  update: {
    consumerVerdict: string | null;
    consumerVerdictLabel: string;
    consumerVerdictBand: string;
    normalizedTrustScore: number;
    normalizedRiskScore: number;
    riskScoreSnapshot: number;
    publicResultPayload?: Prisma.InputJsonValue;
  } | null;
  skipReason?: string;
};

export type BackfillBatchResult = {
  dryRun: boolean;
  scanned: number;
  updated: number;
  skipped: number;
  errors: number;
  nextCursor: string | null;
  hasMore: boolean;
  failureExamples: Array<{ id: string; domain: string; reason: string }>;
};

export type BackfillSummary = BackfillBatchResult & {
  processed: number;
  failed: number;
};

function columnsMatchCanonical(row: BackfillRowInput, canonical: ReturnType<typeof resolveCanonicalFromPersistedColumns>): boolean {
  return (
    row.normalizedTrustScore != null &&
    Math.abs(row.normalizedTrustScore - canonical.trustScore) <= SCORE_TOLERANCE &&
    row.normalizedRiskScore != null &&
    Math.abs(row.normalizedRiskScore - canonical.riskScore) <= SCORE_TOLERANCE &&
    Math.abs(row.riskScoreSnapshot - canonical.riskScore) <= SCORE_TOLERANCE &&
    row.consumerVerdictLabel === canonical.consumerVerdictLabel &&
    row.consumerVerdictBand === canonical.consumerVerdictBand
  );
}

function payloadSchemaCurrent(payload: unknown): boolean {
  return (
    Boolean(payload) &&
    typeof payload === "object" &&
    (payload as { schemaVersion?: number }).schemaVersion === PUBLIC_RESULT_PAYLOAD_SCHEMA_VERSION
  );
}

function payloadCanonicalMatches(
  payload: unknown,
  canonical: ReturnType<typeof resolveCanonicalFromPersistedColumns>
): boolean {
  if (!payloadSchemaCurrent(payload)) return false;
  const parsed = payload as {
    canonical?: { trustScore?: number; riskScore?: number; consumerVerdictLabel?: string };
  };
  const c = parsed.canonical;
  if (!c) return false;
  return (
    Math.abs((c.trustScore ?? -1) - canonical.trustScore) <= SCORE_TOLERANCE &&
    Math.abs((c.riskScore ?? -1) - canonical.riskScore) <= SCORE_TOLERANCE &&
    c.consumerVerdictLabel === canonical.consumerVerdictLabel
  );
}

/** Plans canonical column + optional v2 payload updates for one row (no DB writes). */
export function planBackfillRow(row: BackfillRowInput): BackfillRowPlan {
  const domain = row.normalizedValue;
  const riskSnapshot = normalizeRiskScore(row.riskScoreSnapshot);
  if (!Number.isFinite(riskSnapshot)) {
    return { id: row.id, domain, update: null, skipReason: "invalid_risk_snapshot" };
  }

  const columnCanonical = resolveCanonicalFromPersistedColumns({
    riskScoreSnapshot: riskSnapshot,
    normalizedTrustScore: row.normalizedTrustScore,
    normalizedRiskScore: row.normalizedRiskScore,
    consumerVerdictLabel: row.consumerVerdictLabel,
    consumerVerdictBand: row.consumerVerdictBand,
    consumerVerdict: row.consumerVerdict as ScamVerdict | null | undefined
  });

  const parsed = row.publicResultPayload
    ? parsePublicResultPayload(row.publicResultPayload, domain)
    : null;

  let canonical = columnCanonical;
  let nextPayload: Prisma.InputJsonValue | undefined;

  if (parsed?.result) {
    if (normalizeDomain(parsed.result.domain) !== normalizeDomain(domain)) {
      return { id: row.id, domain, update: null, skipReason: "domain_mismatch" };
    }

    const fromStoredResult =
      parsed.canonical ?? buildCanonicalTrustFieldsFromResult(parsed.result);
    const drift =
      Math.abs(fromStoredResult.trustScore - columnCanonical.trustScore) > SCORE_TOLERANCE ||
      Math.abs(fromStoredResult.riskScore - columnCanonical.riskScore) > SCORE_TOLERANCE;

    canonical = drift ? columnCanonical : fromStoredResult;
    parsed.result.score = canonical.riskScore;

    const normalized = alignNormalizedTrustToCanonical(
      buildNormalizedTrustFromLegacyResult(parsed.result, { route: "backfill/latest-public-check" }),
      canonical,
      { scoreSource: "public_snapshot" }
    );
    nextPayload = buildPublicResultPayloadV2(parsed.result, normalized, canonical) as unknown as Prisma.InputJsonValue;
  }

  const columnsOk = columnsMatchCanonical(row, canonical);
  const payloadOk = nextPayload
    ? payloadCanonicalMatches(nextPayload, canonical)
    : !row.publicResultPayload;

  if (columnsOk && payloadOk) {
    return { id: row.id, domain, update: null, skipReason: "already_canonical" };
  }

  return {
    id: row.id,
    domain,
    update: {
      consumerVerdict: canonical.consumerVerdict,
      consumerVerdictLabel: canonical.consumerVerdictLabel,
      consumerVerdictBand: canonical.consumerVerdictBand,
      normalizedTrustScore: canonical.trustScore,
      normalizedRiskScore: canonical.riskScore,
      riskScoreSnapshot: canonical.riskScore,
      ...(nextPayload ? { publicResultPayload: nextPayload } : {})
    }
  };
}

const backfillSelectFull = {
  id: true,
  normalizedValue: true,
  riskScoreSnapshot: true,
  statusLabel: true,
  publicResultPayload: true,
  consumerVerdict: true,
  consumerVerdictLabel: true,
  consumerVerdictBand: true,
  normalizedTrustScore: true,
  normalizedRiskScore: true
} as const;

const backfillSelectNoPayload = {
  id: true,
  normalizedValue: true,
  riskScoreSnapshot: true,
  statusLabel: true,
  consumerVerdict: true,
  consumerVerdictLabel: true,
  consumerVerdictBand: true,
  normalizedTrustScore: true,
  normalizedRiskScore: true
} as const;

const backfillSelectLegacy = {
  id: true,
  normalizedValue: true,
  riskScoreSnapshot: true,
  statusLabel: true
} as const;

type BackfillSelectMode = "full" | "no_payload" | "legacy";

function isMissingColumnError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2022";
}

async function fetchBackfillRows(
  limit: number,
  cursor?: string
): Promise<{ rows: BackfillRowInput[]; mode: BackfillSelectMode }> {
  const paging = {
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { id: "asc" as const }
  };

  try {
    const rows = await db.latestPublicCheck.findMany({
      ...paging,
      select: backfillSelectFull
    });
    return { rows, mode: "full" };
  } catch (err) {
    if (!isMissingColumnError(err)) throw err;
  }

  try {
    const rows = await db.latestPublicCheck.findMany({
      ...paging,
      select: backfillSelectNoPayload
    });
    return { rows, mode: "no_payload" };
  } catch (err) {
    if (!isMissingColumnError(err)) throw err;
  }

  const rows = await db.latestPublicCheck.findMany({
    ...paging,
    select: backfillSelectLegacy
  });
  return { rows, mode: "legacy" };
}

function updateDataForMode(
  update: NonNullable<BackfillRowPlan["update"]>,
  mode: BackfillSelectMode
): Prisma.LatestPublicCheckUpdateInput {
  if (mode === "full") return update;
  if (mode === "no_payload") {
    const { publicResultPayload: _removed, ...rest } = update;
    return rest;
  }
  return {
    riskScoreSnapshot: update.riskScoreSnapshot
  };
}

async function applyBackfillUpdate(
  id: string,
  update: NonNullable<BackfillRowPlan["update"]>,
  mode: BackfillSelectMode
): Promise<void> {
  const data = updateDataForMode(update, mode);
  try {
    await db.latestPublicCheck.update({ where: { id }, data });
    return;
  } catch (err) {
    if (!isMissingColumnError(err) || mode === "legacy") throw err;
  }

  if (mode === "full") {
    await db.latestPublicCheck.update({
      where: { id },
      data: updateDataForMode(update, "no_payload")
    });
    return;
  }

  await db.latestPublicCheck.update({
    where: { id },
    data: { riskScoreSnapshot: update.riskScoreSnapshot }
  });
}

/** Processes a single cursor page (for API pagination). */
export async function backfillLatestPublicCheckCanonicalBatch(options: {
  dryRun: boolean;
  limit: number;
  cursor?: string | null;
}): Promise<BackfillBatchResult> {
  const limit = Math.max(1, Math.min(100, Math.round(options.limit)));
  const cursor = options.cursor?.trim() || undefined;

  const { rows, mode } = await fetchBackfillRows(limit, cursor);

  const result: BackfillBatchResult = {
    dryRun: options.dryRun,
    scanned: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    nextCursor: null,
    hasMore: rows.length === limit,
    failureExamples: []
  };

  for (const row of rows) {
    result.scanned += 1;
    try {
      const plan = planBackfillRow(row);
      if (!plan.update) {
        result.skipped += 1;
        continue;
      }
      if (!options.dryRun) {
        await applyBackfillUpdate(row.id, plan.update, mode);
      }
      result.updated += 1;
    } catch (err) {
      result.errors += 1;
      if (result.failureExamples.length < 5) {
        result.failureExamples.push({
          id: row.id,
          domain: row.normalizedValue,
          reason: err instanceof Error ? err.message : String(err)
        });
      }
    }
  }

  if (rows.length > 0) {
    result.nextCursor = rows[rows.length - 1]!.id;
  }

  if (process.env.NODE_ENV !== "test") {
    console.info("[backfill/latest-public-check-canonical]", {
      dryRun: options.dryRun,
      schemaMode: mode,
      scanned: result.scanned,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors,
      hasMore: result.hasMore,
      nextCursor: result.hasMore ? result.nextCursor : null
    });
  }

  return result;
}

/** Loops batches until `maxRows` exhausted (CLI script). */
export async function backfillLatestPublicCheckCanonicalTrust(options: {
  dryRun: boolean;
  batchSize: number;
  maxRows?: number;
}): Promise<BackfillSummary> {
  const summary: BackfillSummary = {
    dryRun: options.dryRun,
    scanned: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    processed: 0,
    failed: 0,
    nextCursor: null,
    hasMore: false,
    failureExamples: []
  };

  let cursor: string | null = null;
  const maxRows = options.maxRows ?? Number.POSITIVE_INFINITY;

  while (summary.processed < maxRows) {
    const take = Math.min(options.batchSize, maxRows - summary.processed);
    const batch = await backfillLatestPublicCheckCanonicalBatch({
      dryRun: options.dryRun,
      limit: take,
      cursor
    });

    summary.scanned += batch.scanned;
    summary.updated += batch.updated;
    summary.skipped += batch.skipped;
    summary.errors += batch.errors;
    summary.processed += batch.scanned;
    summary.failed += batch.errors;
    summary.failureExamples.push(...batch.failureExamples);
    summary.nextCursor = batch.nextCursor;
    summary.hasMore = batch.hasMore;

    if (!batch.hasMore || batch.scanned === 0) break;
    cursor = batch.nextCursor;
  }

  return summary;
}
