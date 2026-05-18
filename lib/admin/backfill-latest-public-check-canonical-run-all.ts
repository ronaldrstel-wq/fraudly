import {
  detectLatestPublicCheckSchemaCapabilities,
  type LatestPublicCheckSchemaCapabilities
} from "@/lib/latest-public-checks/detectSchemaCapabilities";
import {
  invalidateLatestPublicChecksCaches,
  type InvalidateLatestPublicChecksCachesResult
} from "@/lib/latest-public-checks/invalidateCaches";
import {
  backfillLatestPublicCheckCanonicalBatch,
  type BackfillBatchProgress,
  type BackfillBatchResult,
  type BackfillRunAllResult,
  type BackfillRunAllStoppedReason,
  type BackfillSummary,
  type LatestPublicCheckBackfillMode
} from "@/lib/admin/backfill-latest-public-check-canonical";

const DEFAULT_RUN_ALL_MAX_BATCHES = 500;
const DEFAULT_RUN_ALL_MAX_DURATION_MS = 55_000;
const MAX_BATCH_PROGRESS_IN_RESPONSE = 100;
const MAX_FAILURE_EXAMPLES = 20;

function logRunAllProgress(progress: BackfillBatchProgress, cumulative: {
  totalScanned: number;
  totalUpdated: number;
  totalSkipped: number;
  totalErrors: number;
}): void {
  if (process.env.NODE_ENV === "test") return;
  console.info("[backfill/latest-public-check-canonical/run-all] batch", {
    batchNumber: progress.batchNumber,
    cursor: progress.cursor,
    batch: {
      scanned: progress.scanned,
      updated: progress.updated,
      skipped: progress.skipped,
      errors: progress.errors,
      hasMore: progress.hasMore,
      nextCursor: progress.nextCursor
    },
    cumulative
  });
}

/**
 * Processes the entire LatestPublicCheck table in automatic cursor batches.
 * Row-level errors are counted and processing continues; batch-level errors stop the run.
 */
export async function backfillLatestPublicCheckCanonicalRunAll(options: {
  dryRun: boolean;
  batchSize?: number;
  cursor?: string | null;
  requireCanonicalColumns?: boolean;
  maxBatches?: number;
  maxDurationMs?: number;
}): Promise<BackfillRunAllResult> {
  const batchSize = Math.max(1, Math.min(100, Math.round(options.batchSize ?? 50)));
  const maxBatches = Math.max(1, options.maxBatches ?? DEFAULT_RUN_ALL_MAX_BATCHES);
  const maxDurationMs = Math.max(1_000, options.maxDurationMs ?? DEFAULT_RUN_ALL_MAX_DURATION_MS);
  const requireCanonical = options.requireCanonicalColumns !== false;

  const startedAt = new Date();
  let cursor: string | null = options.cursor?.trim() || null;
  let batchesProcessed = 0;
  let stoppedReason: BackfillRunAllStoppedReason = "finished";
  let completed = false;
  let blockedReason: string | null = null;
  let schemaCheck: LatestPublicCheckSchemaCapabilities | undefined;
  let schemaMode: LatestPublicCheckBackfillMode = "legacy";

  const totals = { scanned: 0, updated: 0, skipped: 0, errors: 0 };
  const failureExamples: BackfillRunAllResult["failureExamples"] = [];
  const batchProgress: BackfillBatchProgress[] = [];
  const updatedDomains = new Set<string>();
  let finalCursor: string | null = null;

  while (batchesProcessed < maxBatches) {
    if (Date.now() - startedAt.getTime() >= maxDurationMs) {
      stoppedReason = "max_duration";
      break;
    }

    const batchNumber = batchesProcessed + 1;
    let batch: BackfillBatchResult;

    try {
      batch = await backfillLatestPublicCheckCanonicalBatch({
        dryRun: options.dryRun,
        limit: batchSize,
        cursor,
        requireCanonicalColumns: requireCanonical,
        skipCacheInvalidation: true
      });
    } catch (err) {
      stoppedReason = "fatal_batch_error";
      if (failureExamples.length < MAX_FAILURE_EXAMPLES) {
        failureExamples.push({
          id: "batch",
          domain: cursor ?? "(start)",
          reason: err instanceof Error ? err.message : String(err)
        });
      }
      console.error("[backfill/latest-public-check-canonical/run-all] fatal batch error", {
        batchNumber,
        cursor,
        message: err instanceof Error ? err.message : String(err)
      });
      break;
    }

    schemaCheck = batch.schemaCheck;
    schemaMode = batch.schemaMode;

    if (batch.blockedReason) {
      blockedReason = batch.blockedReason;
      stoppedReason = "migration_blocked";
      break;
    }

    batchesProcessed += 1;
    totals.scanned += batch.scanned;
    totals.updated += batch.updated;
    totals.skipped += batch.skipped;
    totals.errors += batch.errors;

    for (const row of batch.changedRows) {
      updatedDomains.add(row.domain);
    }
    for (const ex of batch.failureExamples) {
      if (failureExamples.length < MAX_FAILURE_EXAMPLES) failureExamples.push(ex);
    }

    const progress: BackfillBatchProgress = {
      batchNumber,
      cursor,
      scanned: batch.scanned,
      updated: batch.updated,
      skipped: batch.skipped,
      errors: batch.errors,
      hasMore: batch.hasMore,
      nextCursor: batch.hasMore ? batch.nextCursor : null
    };
    if (batchProgress.length < MAX_BATCH_PROGRESS_IN_RESPONSE) {
      batchProgress.push(progress);
    }
    logRunAllProgress(progress, {
      totalScanned: totals.scanned,
      totalUpdated: totals.updated,
      totalSkipped: totals.skipped,
      totalErrors: totals.errors
    });

    finalCursor = batch.nextCursor;

    if (!batch.hasMore || batch.scanned === 0) {
      completed = true;
      stoppedReason = "finished";
      finalCursor = batch.nextCursor;
      break;
    }

    if (cursor != null && batch.nextCursor != null && batch.nextCursor === cursor) {
      stoppedReason = "stuck_cursor";
      console.error("[backfill/latest-public-check-canonical/run-all] stuck cursor", {
        cursor: batch.nextCursor,
        batchNumber
      });
      break;
    }

    cursor = batch.nextCursor;
  }

  if (!completed && batchesProcessed >= maxBatches && stoppedReason === "finished") {
    stoppedReason = "max_batches";
  }

  const completedAt = new Date();
  let cacheInvalidation: InvalidateLatestPublicChecksCachesResult | null = null;
  if (!options.dryRun && totals.updated > 0) {
    cacheInvalidation = invalidateLatestPublicChecksCaches({ domains: [...updatedDomains] });
  }

  const resumeCursor = completed ? null : finalCursor;
  const resolvedSchemaCheck = schemaCheck ?? (await detectLatestPublicCheckSchemaCapabilities());

  const result: BackfillRunAllResult = {
    dryRun: options.dryRun,
    completed,
    stoppedReason,
    totalScanned: totals.scanned,
    totalUpdated: totals.updated,
    totalSkipped: totals.skipped,
    totalErrors: totals.errors,
    batchesProcessed,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    durationMs: completedAt.getTime() - startedAt.getTime(),
    finalCursor,
    resumeCursor,
    schemaMode: schemaCheck?.backfillSelectMode ?? resolvedSchemaCheck.backfillSelectMode,
    schemaCheck: resolvedSchemaCheck,
    cacheInvalidation,
    blockedReason,
    failureExamples,
    domainsUpdatedCount: updatedDomains.size,
    batchProgress,
    limits: { batchSize, maxBatches, maxDurationMs }
  };

  if (process.env.NODE_ENV !== "test") {
    console.info("[backfill/latest-public-check-canonical/run-all] complete", {
      dryRun: result.dryRun,
      completed: result.completed,
      stoppedReason: result.stoppedReason,
      batchesProcessed: result.batchesProcessed,
      totalScanned: result.totalScanned,
      totalUpdated: result.totalUpdated,
      totalSkipped: result.totalSkipped,
      totalErrors: result.totalErrors,
      durationMs: result.durationMs,
      resumeCursor: result.resumeCursor,
      cacheInvalidation: cacheInvalidation
        ? {
            tag: cacheInvalidation.tag,
            pathCount: cacheInvalidation.paths.length,
            domainPathCount: cacheInvalidation.domainPaths.length
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
  const maxRows = options.maxRows ?? Number.POSITIVE_INFINITY;
  const maxBatches = Math.ceil(maxRows / options.batchSize) + 1;

  const runAll = await backfillLatestPublicCheckCanonicalRunAll({
    dryRun: options.dryRun,
    batchSize: options.batchSize,
    maxBatches,
    maxDurationMs: 600_000,
    requireCanonicalColumns: true
  });

  return {
    dryRun: runAll.dryRun,
    schemaMode: runAll.schemaMode,
    schemaCheck: runAll.schemaCheck,
    scanned: runAll.totalScanned,
    updated: runAll.totalUpdated,
    skipped: runAll.totalSkipped,
    errors: runAll.totalErrors,
    processed: runAll.totalScanned,
    failed: runAll.totalErrors,
    nextCursor: runAll.resumeCursor,
    hasMore: !runAll.completed,
    failureExamples: runAll.failureExamples,
    changedRows: [],
    cacheInvalidation: runAll.cacheInvalidation,
    blockedReason: runAll.blockedReason
  };
}
