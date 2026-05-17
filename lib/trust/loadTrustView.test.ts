import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveAnalysisResult } from "@/lib/trust/loadTrustView";
import type { LatestPublicCheckSnapshot } from "@/lib/latest-public-checks/snapshot";

vi.mock("@/lib/analysis/cachedAnalysis", () => ({
  getCachedWebsiteAnalysis: vi.fn(async () => ({ domain: "cached.example", score: 99 } as never))
}));

import { getCachedWebsiteAnalysis } from "@/lib/analysis/cachedAnalysis";

function snapshot(partial: Partial<LatestPublicCheckSnapshot>): LatestPublicCheckSnapshot {
  return {
    id: "snap1",
    normalizedValue: "example.com",
    checkedValue: "example.com",
    lastSeenAt: new Date(),
    display: {
      riskScore: 22,
      trustScore: 78,
      band: "trusted",
      label: "Mostly Safe",
      verdict: "safe",
      scanId: "snap1"
    },
    canonical: {
      trustScore: 78,
      riskScore: 22,
      consumerVerdict: "safe",
      consumerVerdictLabel: "Mostly Safe",
      consumerVerdictBand: "mostly-safe",
      scoreConfidence: "medium"
    },
    storedResult: { domain: "example.com", score: 22 } as never,
    storedNormalized: null,
    statusLabel: "Lower risk context snapshot",
    ...partial
  };
}

describe("resolveAnalysisResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses stored payload and does not call cached analysis when present", async () => {
    const snap = snapshot({});
    const { result, resultSource } = await resolveAnalysisResult("example.com", snap, "snap1");
    expect(resultSource).toBe("stored-payload");
    expect(result.domain).toBe("example.com");
    expect(getCachedWebsiteAnalysis).not.toHaveBeenCalled();
  });

  it("pinned scanId without payload still uses live cache for signals", async () => {
    const snap = snapshot({ storedResult: null });
    const { resultSource } = await resolveAnalysisResult("example.com", snap, "snap1");
    expect(resultSource).toBe("live-cache");
    expect(getCachedWebsiteAnalysis).toHaveBeenCalledWith("example.com");
  });
});
