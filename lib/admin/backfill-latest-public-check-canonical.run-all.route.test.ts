import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const runAllMock = vi.fn();

vi.mock("@/lib/admin/backfill-latest-public-check-canonical-run-all", () => ({
  backfillLatestPublicCheckCanonicalRunAll: (...args: unknown[]) => runAllMock(...args)
}));

vi.mock("@/lib/auth/admin", () => ({
  getCurrentUserIsAdmin: vi.fn(async () => false)
}));

import { POST } from "@/app/api/admin/backfill-latest-public-check-canonical/run-all/route";

describe("POST /api/admin/backfill-latest-public-check-canonical/run-all", () => {
  const oldKey = process.env.ADMIN_RECALC_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_RECALC_KEY = "test-admin-recalc-key";
    runAllMock.mockResolvedValue({
      dryRun: false,
      completed: true,
      stoppedReason: "finished",
      totalScanned: 100,
      totalUpdated: 80,
      totalSkipped: 20,
      totalErrors: 0,
      batchesProcessed: 2,
      startedAt: "2026-01-01T00:00:00.000Z",
      completedAt: "2026-01-01T00:00:05.000Z",
      durationMs: 5000,
      finalCursor: "last-id",
      resumeCursor: null,
      schemaMode: "full",
      schemaCheck: {},
      cacheInvalidation: { tag: "t", paths: [], domainPaths: [] },
      blockedReason: null,
      failureExamples: [],
      domainsUpdatedCount: 80,
      batchProgress: [],
      limits: { batchSize: 50, maxBatches: 500, maxDurationMs: 55_000 }
    });
  });

  afterEach(() => {
    process.env.ADMIN_RECALC_KEY = oldKey;
  });

  it("rejects missing admin key", async () => {
    const res = await POST(
      new Request("http://localhost/api/admin/backfill-latest-public-check-canonical/run-all", {
        method: "POST"
      })
    );
    expect(res.status).toBe(401);
  });

  it("runs full backfill with configurable limits", async () => {
    const res = await POST(
      new Request(
        "http://localhost/api/admin/backfill-latest-public-check-canonical/run-all?dryRun=false&limit=50&maxBatches=10&maxDurationMs=50000",
        { method: "POST", headers: { "x-admin-key": "test-admin-recalc-key" } }
      )
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalUpdated).toBe(80);
    expect(body.completed).toBe(true);
    expect(runAllMock).toHaveBeenCalledWith({
      dryRun: false,
      batchSize: 50,
      cursor: null,
      requireCanonicalColumns: true,
      maxBatches: 10,
      maxDurationMs: 50_000
    });
  });

  it("returns 202 when run stops early", async () => {
    runAllMock.mockResolvedValueOnce({
      dryRun: false,
      completed: false,
      stoppedReason: "max_duration",
      totalScanned: 50,
      totalUpdated: 40,
      totalSkipped: 10,
      totalErrors: 0,
      batchesProcessed: 1,
      startedAt: "2026-01-01T00:00:00.000Z",
      completedAt: "2026-01-01T00:00:55.000Z",
      durationMs: 55_000,
      finalCursor: "mid-id",
      resumeCursor: "mid-id",
      schemaMode: "full",
      schemaCheck: {},
      cacheInvalidation: null,
      blockedReason: null,
      failureExamples: [],
      domainsUpdatedCount: 40,
      batchProgress: [],
      limits: { batchSize: 50, maxBatches: 500, maxDurationMs: 55_000 }
    });

    const res = await POST(
      new Request(
        "http://localhost/api/admin/backfill-latest-public-check-canonical/run-all?dryRun=false",
        { method: "POST", headers: { "x-admin-key": "test-admin-recalc-key" } }
      )
    );
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.resumeHint).toContain("cursor=mid-id");
  });
});
