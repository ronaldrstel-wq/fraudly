import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LatestPublicCheckListRow } from "@/lib/latest-public-checks/listPublicChecks";

vi.mock("@/lib/latest-public-checks/listPublicChecks", () => ({
  fetchLatestPublicChecksPage: vi.fn()
}));

import { fetchLatestPublicChecksPage } from "@/lib/latest-public-checks/listPublicChecks";
import { fetchLatestPublicChecksFeedPage } from "@/lib/latest-public-checks/fetchFeedPage";

function row(id: string, domain: string, lastSeenAt: string): LatestPublicCheckListRow {
  return {
    id,
    normalizedValue: domain,
    checkedValue: `https://${domain}/`,
    entityType: "domain",
    riskScoreSnapshot: 40,
    statusLabel: "Lower risk context snapshot",
    publicResultPath: `/check/${domain}`,
    lastSeenAt: new Date(lastSeenAt)
  };
}

describe("fetchLatestPublicChecksFeedPage", () => {
  beforeEach(() => {
    vi.mocked(fetchLatestPublicChecksPage).mockReset();
  });

  it("page 1 uses skip 0 and fills from valid rows after skipping invalid", async () => {
    vi.mocked(fetchLatestPublicChecksPage).mockResolvedValueOnce({
      loadFailed: false,
      rows: [
        { ...row("bad", "", "2026-05-03T00:00:00.000Z"), normalizedValue: "", checkedValue: "" },
        row("ok-1", "alpha.com", "2026-05-02T00:00:00.000Z"),
        row("ok-2", "beta.com", "2026-05-01T00:00:00.000Z")
      ]
    });

    const result = await fetchLatestPublicChecksFeedPage(1, 2, { bypassCache: true });
    expect(fetchLatestPublicChecksPage).toHaveBeenCalledWith(0, expect.any(Number), { bypassCache: true });
    expect(result.loadFailed).toBe(false);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]?.id).toBe("ok-1");
    expect(result.skipped.some((s) => s.reason === "missing_domain")).toBe(true);
  });

  it("page 2 uses skip 10 for pageSize 10", async () => {
    vi.mocked(fetchLatestPublicChecksPage).mockResolvedValueOnce({
      loadFailed: false,
      rows: [row("p2-1", "gamma.com", "2026-04-01T00:00:00.000Z")]
    });

    await fetchLatestPublicChecksFeedPage(2, 10, { bypassCache: true });
    expect(fetchLatestPublicChecksPage).toHaveBeenCalledWith(10, expect.any(Number), { bypassCache: true });
  });

  it("page 3 pagination still works with string lastSeenAt", async () => {
    vi.mocked(fetchLatestPublicChecksPage).mockResolvedValueOnce({
      loadFailed: false,
      rows: [
        {
          ...row("p3-1", "delta.com", "2026-03-01T00:00:00.000Z"),
          lastSeenAt: "2026-03-01T00:00:00.000Z" as unknown as Date
        }
      ]
    });

    const result = await fetchLatestPublicChecksFeedPage(3, 10, { bypassCache: true });
    expect(fetchLatestPublicChecksPage).toHaveBeenCalledWith(20, expect.any(Number), { bypassCache: true });
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.id).toBe("p3-1");
  });
});
