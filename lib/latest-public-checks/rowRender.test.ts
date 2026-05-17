import { describe, expect, it } from "vitest";
import { assessLatestCheckRowRenderable } from "@/lib/latest-public-checks/rowRender";
import { normalizeLastSeenAt } from "@/lib/latest-public-checks/normalizeLastSeenAt";
import { feedListRowConfidenceBadges } from "@/lib/trust/feedConfidenceStrip";
import type { LatestPublicCheckListRow } from "@/lib/latest-public-checks/listPublicChecks";

const baseRow: LatestPublicCheckListRow = {
  id: "row-1",
  normalizedValue: "example.com",
  checkedValue: "https://example.com/",
  entityType: "domain",
  riskScoreSnapshot: 42,
  statusLabel: "Lower risk context snapshot",
  publicResultPath: "/check/example.com",
  lastSeenAt: new Date("2026-05-01T12:00:00.000Z")
};

describe("rowRender", () => {
  it("normalizes ISO string lastSeenAt from unstable_cache", () => {
    const iso = "2026-05-01T12:00:00.000Z";
    expect(() =>
      feedListRowConfidenceBadges({
        lastSeenAt: iso,
        normalizedTrustScore: null,
        consumerVerdictLabel: null
      })
    ).not.toThrow();
    expect(normalizeLastSeenAt(iso).toISOString()).toBe(iso);
  });

  it("renders rows with null canonical fields", () => {
    const assessed = assessLatestCheckRowRenderable({
      ...baseRow,
      normalizedTrustScore: null,
      consumerVerdictLabel: null,
      consumerVerdictBand: null
    });
    expect(assessed.renderable).toBe(true);
  });

  it("skips rows without domain", () => {
    const assessed = assessLatestCheckRowRenderable({
      ...baseRow,
      normalizedValue: "",
      checkedValue: ""
    });
    expect(assessed.renderable).toBe(false);
    expect(assessed.reason).toBe("missing_domain");
  });
});
