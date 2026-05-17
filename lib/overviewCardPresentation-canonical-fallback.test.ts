import { describe, expect, it } from "vitest";
import { buildOverviewFromPublicCheck } from "@/lib/overviewCardPresentation";
import { PUBLIC_SNAPSHOT_LABEL_STRONG_RISK } from "@/lib/latest-public-checks/status-label";

describe("buildOverviewFromPublicCheck canonical fallback", () => {
  it("derives trust from risk when canonical columns empty", () => {
    const m = buildOverviewFromPublicCheck({
      riskScoreSnapshot: 20,
      statusLabel: PUBLIC_SNAPSHOT_LABEL_STRONG_RISK
    });
    expect(m.trustScore).toBe(80);
    expect(m.verdictLabel).toBe("Mostly Safe");
  });

  it("prefers persisted canonical columns over statusLabel", () => {
    const m = buildOverviewFromPublicCheck({
      riskScoreSnapshot: 88,
      statusLabel: PUBLIC_SNAPSHOT_LABEL_STRONG_RISK,
      normalizedTrustScore: 78,
      consumerVerdictLabel: "Mostly Safe"
    });
    expect(m.trustScore).toBe(78);
    expect(m.verdictLabel).toBe("Mostly Safe");
  });
});
