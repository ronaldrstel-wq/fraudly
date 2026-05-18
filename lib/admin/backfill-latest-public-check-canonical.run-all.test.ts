import { beforeEach, describe, expect, it, vi } from "vitest";

const batchMock = vi.fn();
const invalidateMock = vi.fn();
const detectMock = vi.fn();

vi.mock("@/lib/admin/backfill-latest-public-check-canonical", () => ({
  backfillLatestPublicCheckCanonicalBatch: (...args: unknown[]) => batchMock(...args)
}));

vi.mock("@/lib/latest-public-checks/invalidateCaches", () => ({
  invalidateLatestPublicChecksCaches: (...args: unknown[]) => invalidateMock(...args)
}));

vi.mock("@/lib/latest-public-checks/detectSchemaCapabilities", () => ({
  detectLatestPublicCheckSchemaCapabilities: () => detectMock()
}));

import type { BackfillBatchResult } from "@/lib/admin/backfill-latest-public-check-canonical";
import { backfillLatestPublicCheckCanonicalRunAll } from "@/lib/admin/backfill-latest-public-check-canonical-run-all";

const baseSchema: BackfillBatchResult["schemaCheck"] = {
  presentColumns: [],
  hasPublicResultPayload: true,
  hasCanonicalTrustColumns: true,
  missingCanonicalColumns: [],
  backfillSelectMode: "full",
  canWriteCanonicalColumns: true,
  canWriteRiskSnapshot: true,
  migrationRequired: false,
  migrationHint: null
};

function batchResult(partial: {
  scanned: number;
  updated: number;
  hasMore: boolean;
  nextCursor: string | null;
}): BackfillBatchResult {
  return {
    dryRun: false,
    schemaMode: "full",
    schemaCheck: baseSchema,
    scanned: partial.scanned,
    updated: partial.updated,
    skipped: 0,
    errors: 0,
    hasMore: partial.hasMore,
    nextCursor: partial.nextCursor,
    failureExamples: [],
    changedRows: partial.updated
      ? [{ id: partial.nextCursor ?? "r1", domain: "example.com", schemaMode: "full", changes: [] }]
      : [],
    cacheInvalidation: null,
    blockedReason: null
  };
}

describe("backfillLatestPublicCheckCanonicalRunAll", () => {
  beforeEach(() => {
    batchMock.mockReset();
    invalidateMock.mockReset();
    detectMock.mockReset();
    invalidateMock.mockReturnValue({ tag: "latest-public-checks-feed", paths: ["/"], domainPaths: [] });
    detectMock.mockResolvedValue(baseSchema);
  });

  it("runs multiple batches until hasMore is false", async () => {
    batchMock
      .mockResolvedValueOnce(batchResult({ scanned: 2, updated: 1, hasMore: true, nextCursor: "row-2" }))
      .mockResolvedValueOnce(batchResult({ scanned: 1, updated: 1, hasMore: false, nextCursor: "row-3" }));

    const result = await backfillLatestPublicCheckCanonicalRunAll({
      dryRun: false,
      batchSize: 50,
      maxBatches: 10,
      maxDurationMs: 60_000
    });

    expect(result.completed).toBe(true);
    expect(result.stoppedReason).toBe("finished");
    expect(result.batchesProcessed).toBe(2);
    expect(result.totalScanned).toBe(3);
    expect(result.totalUpdated).toBe(2);
    expect(batchMock).toHaveBeenCalledTimes(2);
    expect(batchMock.mock.calls[1]?.[0]).toMatchObject({ cursor: "row-2", skipCacheInvalidation: true });
    expect(invalidateMock).toHaveBeenCalledTimes(1);
    expect(result.resumeCursor).toBeNull();
  });

  it("stops at maxBatches and exposes resumeCursor", async () => {
    batchMock.mockResolvedValue(
      batchResult({ scanned: 50, updated: 10, hasMore: true, nextCursor: "row-50" })
    );

    const result = await backfillLatestPublicCheckCanonicalRunAll({
      dryRun: true,
      batchSize: 50,
      maxBatches: 1,
      maxDurationMs: 60_000
    });

    expect(result.completed).toBe(false);
    expect(result.stoppedReason).toBe("max_batches");
    expect(result.batchesProcessed).toBe(1);
    expect(result.resumeCursor).toBe("row-50");
    expect(invalidateMock).not.toHaveBeenCalled();
  });

  it("returns migration_blocked on first batch without advancing cursor", async () => {
    batchMock.mockResolvedValue({
      ...batchResult({ scanned: 0, updated: 0, hasMore: false, nextCursor: null }),
      blockedReason: "Run migrate deploy",
      schemaCheck: {
        ...baseSchema,
        migrationRequired: true,
        canWriteCanonicalColumns: false,
        migrationHint: "Run migrate deploy"
      }
    });

    const result = await backfillLatestPublicCheckCanonicalRunAll({
      dryRun: false,
      requireCanonicalColumns: true
    });

    expect(result.stoppedReason).toBe("migration_blocked");
    expect(result.batchesProcessed).toBe(0);
    expect(result.blockedReason).toBe("Run migrate deploy");
    expect(batchMock).toHaveBeenCalledTimes(1);
  });
});
