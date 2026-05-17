import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Prisma } from "@prisma/client";

const innerFetch = vi.fn();

vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn
}));

vi.mock("@/lib/db", () => ({
  db: {
    latestPublicCheck: {
      findMany: (...args: unknown[]) => innerFetch(...args)
    }
  }
}));

import { buildOverviewFromPublicCheck } from "@/lib/overviewCardPresentation";
import {
  fetchLatestPublicChecksPage,
  latestChecksCacheBypassEnabled
} from "@/lib/latest-public-checks/listPublicChecks";

const legacyRow = {
  id: "legacy-1",
  normalizedValue: "example.com",
  checkedValue: "https://example.com/",
  entityType: "domain",
  riskScoreSnapshot: 42,
  statusLabel: "Lower risk context snapshot",
  publicResultPath: "/check/example.com",
  lastSeenAt: new Date("2026-01-01T00:00:00.000Z")
};

describe("latest checks regression", () => {
  beforeEach(() => {
    innerFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders overview cards when canonical columns are NULL", () => {
    const model = buildOverviewFromPublicCheck({
      riskScoreSnapshot: 42,
      statusLabel: "Lower risk context snapshot",
      normalizedTrustScore: null,
      consumerVerdictLabel: null
    });
    expect(model.trustScore).toBeGreaterThan(0);
    expect(model.verdictLabel).toBeTruthy();
  });

  it("falls back to legacy select when canonical columns are missing (P2022)", async () => {
    innerFetch
      .mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError("column missing", {
          code: "P2022",
          clientVersion: "test"
        })
      )
      .mockResolvedValueOnce([legacyRow]);

    const result = await fetchLatestPublicChecksPage(0, 10);
    expect(result.loadFailed).toBe(false);
    expect(result.rows).toHaveLength(1);
    expect(innerFetch).toHaveBeenCalledTimes(2);
  });

  it("bypasses unstable_cache when LATEST_CHECKS_BYPASS_CACHE=true", () => {
    vi.stubEnv("LATEST_CHECKS_BYPASS_CACHE", "true");
    expect(latestChecksCacheBypassEnabled()).toBe(true);
  });

  it("returns rows without enrichment or canonical fields", async () => {
    innerFetch.mockResolvedValueOnce([legacyRow]);
    const result = await fetchLatestPublicChecksPage(0, 10, { bypassCache: true });
    expect(result.loadFailed).toBe(false);
    expect(result.rows[0]?.normalizedTrustScore).toBeUndefined();
  });
});
