import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const batchMock = vi.fn();

const schemaCheckMock = vi.fn();

vi.mock("@/lib/admin/backfill-latest-public-check-canonical", () => ({
  backfillLatestPublicCheckCanonicalBatch: (...args: unknown[]) => batchMock(...args),
  getLatestPublicCheckBackfillSchemaCheck: () => schemaCheckMock()
}));

vi.mock("@/lib/auth/admin", () => ({
  getCurrentUserIsAdmin: vi.fn(async () => false)
}));

import { GET, POST } from "@/app/api/admin/backfill-latest-public-check-canonical/route";

const baseSchemaCheck = {
  presentColumns: ["riskScoreSnapshot"],
  hasPublicResultPayload: true,
  hasCanonicalTrustColumns: true,
  missingCanonicalColumns: [] as string[],
  backfillSelectMode: "full" as const,
  canWriteCanonicalColumns: true,
  canWriteRiskSnapshot: true,
  migrationRequired: false,
  migrationHint: null
};

describe("POST /api/admin/backfill-latest-public-check-canonical", () => {
  const oldKey = process.env.ADMIN_RECALC_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_RECALC_KEY = "test-admin-recalc-key";
    schemaCheckMock.mockResolvedValue(baseSchemaCheck);
    batchMock.mockResolvedValue({
      dryRun: true,
      schemaMode: "full",
      schemaCheck: baseSchemaCheck,
      scanned: 2,
      updated: 1,
      skipped: 1,
      errors: 0,
      nextCursor: "row-2",
      hasMore: true,
      failureExamples: [],
      changedRows: [{ id: "row-1", domain: "example.com", schemaMode: "full", changes: [] }],
      cacheInvalidation: null,
      blockedReason: null
    });
  });

  afterEach(() => {
    process.env.ADMIN_RECALC_KEY = oldKey;
  });

  it("rejects missing admin key", async () => {
    const res = await POST(
      new Request("http://localhost/api/admin/backfill-latest-public-check-canonical", { method: "POST" })
    );
    expect(res.status).toBe(401);
  });

  it("runs dry-run batch with limit and cursor", async () => {
    const res = await POST(
      new Request(
        "http://localhost/api/admin/backfill-latest-public-check-canonical?dryRun=true&limit=50&cursor=row-1",
        {
          method: "POST",
          headers: { "x-admin-key": "test-admin-recalc-key" }
        }
      )
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dryRun).toBe(true);
    expect(body.scanned).toBe(2);
    expect(body.nextCursor).toBe("row-2");
    expect(body.schemaMode).toBe("full");
    expect(body.changedRows).toHaveLength(1);
    expect(batchMock).toHaveBeenCalledWith({
      dryRun: true,
      limit: 50,
      cursor: "row-1",
      requireCanonicalColumns: true
    });
  });

  it("GET returns schema check for admin key", async () => {
    const res = await GET(
      new Request("http://localhost/api/admin/backfill-latest-public-check-canonical", {
        headers: { "x-admin-key": "test-admin-recalc-key" }
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.readyForCanonicalBackfill).toBe(true);
    expect(body.schemaCheck.backfillSelectMode).toBe("full");
  });

  it("POST returns 409 when migration required", async () => {
    batchMock.mockResolvedValueOnce({
      dryRun: false,
      schemaMode: "legacy",
      schemaCheck: { ...baseSchemaCheck, migrationRequired: true, canWriteCanonicalColumns: false },
      scanned: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      nextCursor: null,
      hasMore: false,
      failureExamples: [],
      changedRows: [],
      cacheInvalidation: null,
      blockedReason: "Run migrate deploy"
    });

    const res = await POST(
      new Request(
        "http://localhost/api/admin/backfill-latest-public-check-canonical?dryRun=false",
        { method: "POST", headers: { "x-admin-key": "test-admin-recalc-key" } }
      )
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("migration_required");
  });
});
