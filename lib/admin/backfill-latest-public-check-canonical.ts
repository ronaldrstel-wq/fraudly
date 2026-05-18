import { normalizeDomain } from "@/lib/cache";
import { db } from "@/lib/db";
import {
  detectLatestPublicCheckSchemaCapabilities,
  type LatestPublicCheckBackfillMode,
  type LatestPublicCheckSchemaCapabilities
} from "@/lib/latest-public-checks/detectSchemaCapabilities";
import {
  invalidateLatestPublicChecksCaches,
  type InvalidateLatestPublicChecksCachesResult
} from "@/lib/latest-public-checks/invalidateCaches";
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
  columnChanges?: BackfillColumnChange[];
};

export type BackfillColumnChange = {
  column: string;
  before: string | number | null;
  after: string | number | null;
};

export type BackfillChangedRow = {
  id: string;
  domain: string;
  schemaMode: LatestPublicCheckBackfillMode;
  changes: BackfillColumnChange[];
};

export type BackfillBatchResult = {
  dryRun: boolean;
  schemaMode: LatestPublicCheckBackfillMode;
  schemaCheck: LatestPublicCheckSchemaCapabilities;
  scanned: number;
  updated: number;
  skipped: number;
  errors: number;
  nextCursor: string | null;
  hasMore: boolean;
  failureExamples: Array<{ id: string; domain: string; reason: string }>;
  changedRows: BackfillChangedRow[];
  cacheInvalidation: InvalidateLatestPublicChecksCachesResult | null;
  blockedReason: string | null;
};

export type BackfillSummary = BackfillBatchResult & {
  processed: number;
  failed: number;
};

const BACKFILL_TRACKED_COLUMNS = [
  "riskScoreSnapshot",
  "normalizedTrustScore",
  "normalizedRiskScore",
  "consumerVerdict",
  "consumerVerdictLabel",
  "consumerVerdictBand",
  "publicResultPayload"
] as const;

function serializeBackfillValue(value: unknown): string | number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "[object]";
    }
  }
  return String(value);
}

/** Lists column deltas for logging / API output (no DB writes). */
export function diffBackfillColumnChanges(
  row: BackfillRowInput,
  update: NonNullable<BackfillRowPlan["update"]>
): BackfillColumnChange[] {
  const changes: BackfillColumnChange[] = [];
  for (const column of BACKFILL_TRACKED_COLUMNS) {
    const before = serializeBackfillValue(row[column as keyof BackfillRowInput]);
    const after = serializeBackfillValue(update[column as keyof typeof update]);
    if (before !== after) {
      changes.push({ column, before, after });
    }
  }
  return changes;
}

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

  const update = {
    consumerVerdict: canonical.consumerVerdict,
    consumerVerdictLabel: canonical.consumerVerdictLabel,
    consumerVerdictBand: canonical.consumerVerdictBand,
    normalizedTrustScore: canonical.trustScore,
    normalizedRiskScore: canonical.riskScore,
    riskScoreSnapshot: canonical.riskScore,
    ...(nextPayload ? { publicResultPayload: nextPayload } : {})
  };

  return {
    id: row.id,
    domain,
    update,
    columnChanges: diffBackfillColumnChanges(row, update)
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

export type BackfillSelectMode = LatestPublicCheckBackfillMode;

function selectForCapabilities(caps: LatestPublicCheckSchemaCapabilities) {
  if (caps.backfillSelectMode === "full") return backfillSelectFull;
  if (caps.backfillSelectMode === "no_payload") return backfillSelectNoPayload;
  return backfillSelectLegacy;
}

async function fetchBackfillRows(
  limit: number,
  caps: LatestPublicCheckSchemaCapabilities,
  cursor?: string
): Promise<{ rows: BackfillRowInput[]; mode: LatestPublicCheckBackfillMode }> {
  const paging = {
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { id: "asc" as const }
  };

  const rows = await db.latestPublicCheck.findMany({
    ...paging,
    select: selectForCapabilities(caps)
  });
  return { rows, mode: caps.backfillSelectMode };
}

/** Writes only columns that exist in the database (never touches missing canonical fields). */
export function buildBackfillUpdateForCapabilities(
  update: NonNullable<BackfillRowPlan["update"]>,
  caps: LatestPublicCheckSchemaCapabilities
): Prisma.LatestPublicCheckUpdateInput {
  const data: Prisma.LatestPublicCheckUpdateInput = {
    riskScoreSnapshot: update.riskScoreSnapshot
  };

  if (caps.canWriteCanonicalColumns) {
    data.consumerVerdict = update.consumerVerdict;
    data.consumerVerdictLabel = update.consumerVerdictLabel;
    data.consumerVerdictBand = update.consumerVerdictBand;
    data.normalizedTrustScore = update.normalizedTrustScore;
    data.normalizedRiskScore = update.normalizedRiskScore;
  }

  if (caps.hasPublicResultPayload && update.publicResultPayload !== undefined) {
    data.publicResultPayload = update.publicResultPayload;
  }

  return data;
}

async function applyBackfillUpdate(
  id: string,
  update: NonNullable<BackfillRowPlan["update"]>,
  caps: LatestPublicCheckSchemaCapabilities
): Promise<void> {
  const data = buildBackfillUpdateForCapabilities(update, caps);
  await db.latestPublicCheck.update({ where: { id }, data });
}

/** Admin/startup probe — call before dryRun=false canonical backfill. */
export async function getLatestPublicCheckBackfillSchemaCheck(): Promise<LatestPublicCheckSchemaCapabilities> {
  return detectLatestPublicCheckSchemaCapabilities();
}

/** Processes a single cursor page (for API pagination). */
export async function backfillLatestPublicCheckCanonicalBatch(options: {
  dryRun: boolean;
  limit: number;
  cursor?: string | null;
  /** When true (default), dryRun=false is blocked until canonical columns exist. */
  requireCanonicalColumns?: boolean;
}): Promise<BackfillBatchResult> {
  const limit = Math.max(1, Math.min(100, Math.round(options.limit)));
  const cursor = options.cursor?.trim() || undefined;
  const requireCanonical = options.requireCanonicalColumns !== false;

  const schemaCheck = await detectLatestPublicCheckSchemaCapabilities();
  const blockedReason =
    !options.dryRun && requireCanonical && schemaCheck.migrationRequired
      ? (schemaCheck.migrationHint ?? "Canonical columns missing; run prisma migrate deploy.")
      : null;

  const result: BackfillBatchResult = {
    dryRun: options.dryRun,
    schemaMode: schemaCheck.backfillSelectMode,
    schemaCheck,
    scanned: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    nextCursor: null,
    hasMore: false,
    failureExamples: [],
    changedRows: [],
    cacheInvalidation: null,
    blockedReason
  };

  if (blockedReason) {
    return result;
  }

  const { rows, mode } = await fetchBackfillRows(limit, schemaCheck, cursor);
  result.schemaMode = mode;
  result.hasMore = rows.length === limit;

  const updatedDomains: string[] = [];

  for (const row of rows) {
    result.scanned += 1;
    try {
      const plan = planBackfillRow(row);
      if (!plan.update) {
        result.skipped += 1;
        continue;
      }
      if (!options.dryRun) {
        await applyBackfillUpdate(row.id, plan.update, schemaCheck);
      }
      result.updated += 1;
      updatedDomains.push(plan.domain);
      if (result.changedRows.length < 50) {
        result.changedRows.push({
          id: plan.id,
          domain: plan.domain,
          schemaMode: mode,
          changes: plan.columnChanges ?? diffBackfillColumnChanges(row, plan.update)
        });
      }
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

  if (!options.dryRun && result.updated > 0) {
    result.cacheInvalidation = invalidateLatestPublicChecksCaches({ domains: updatedDomains });
  }

  if (process.env.NODE_ENV !== "test") {
    console.info("[backfill/latest-public-check-canonical]", {
      dryRun: options.dryRun,
      schemaMode: mode,
      migrationRequired: schemaCheck.migrationRequired,
      missingCanonicalColumns: schemaCheck.missingCanonicalColumns,
      scanned: result.scanned,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors,
      hasMore: result.hasMore,
      nextCursor: result.hasMore ? result.nextCursor : null,
      changedRowCount: result.changedRows.length,
      changedRows: result.changedRows,
      cacheInvalidation: result.cacheInvalidation
        ? {
            tag: result.cacheInvalidation.tag,
            pathCount: result.cacheInvalidation.paths.length,
            domainPathCount: result.cacheInvalidation.domainPaths.length
          }
        : null
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
  const initialSchema = await detectLatestPublicCheckSchemaCapabilities();
  const summary: BackfillSummary = {
    dryRun: options.dryRun,
    schemaMode: initialSchema.backfillSelectMode,
    schemaCheck: initialSchema,
    scanned: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    processed: 0,
    failed: 0,
    nextCursor: null,
    hasMore: false,
    failureExamples: [],
    changedRows: [],
    cacheInvalidation: null,
    blockedReason: null
  };

  let cursor: string | null = null;
  const maxRows = options.maxRows ?? Number.POSITIVE_INFINITY;

  while (summary.processed < maxRows) {
    const take = Math.min(options.batchSize, maxRows - summary.processed);
    const batch = await backfillLatestPublicCheckCanonicalBatch({
      dryRun: options.dryRun,
      limit: take,
      cursor,
      requireCanonicalColumns: true
    });

    if (batch.blockedReason) {
      summary.blockedReason = batch.blockedReason;
      summary.schemaCheck = batch.schemaCheck;
      break;
    }

    summary.scanned += batch.scanned;
    summary.updated += batch.updated;
    summary.skipped += batch.skipped;
    summary.errors += batch.errors;
    summary.processed += batch.scanned;
    summary.failed += batch.errors;
    summary.failureExamples.push(...batch.failureExamples);
    summary.changedRows.push(...batch.changedRows);
    summary.nextCursor = batch.nextCursor;
    summary.hasMore = batch.hasMore;
    summary.schemaMode = batch.schemaMode;
    summary.schemaCheck = batch.schemaCheck;
    if (batch.cacheInvalidation) {
      summary.cacheInvalidation = batch.cacheInvalidation;
    }

    if (!batch.hasMore || batch.scanned === 0) break;
    cursor = batch.nextCursor;
  }

  return summary;
}
