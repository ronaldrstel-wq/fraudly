import { describe, expect, it } from "vitest";
import { resolveGoogleReviewMatch, resolveTrustpilotReviewMatch } from "@/lib/reputation/reviewMatchConfidence";
import type { ReviewSignals } from "@/lib/reviewSignals";

const base: ReviewSignals = {
  googleFound: false,
  trustpilotFound: false,
  suspiciousReviewSignals: [],
  sources: [],
  warnings: [],
  publicReviewAvailabilityNotes: [],
  reviewFetchDebug: []
};

describe("reviewMatchConfidence", () => {
  it("hides rating without review count", () => {
    const match = resolveGoogleReviewMatch({ ...base, googleRating: 2, googleReviewCount: undefined });
    expect(match.displayable).toBe(false);
    expect(match.confidence).toBe("low");
  });

  it("shows high-confidence match with rating and sufficient count", () => {
    const match = resolveTrustpilotReviewMatch({
      ...base,
      trustpilotRating: 4.6,
      trustpilotReviewCount: 1200
    });
    expect(match.displayable).toBe(true);
    expect(match.confidence).toBe("high");
  });

  it("shows Trustpilot when only rating is present", () => {
    const match = resolveTrustpilotReviewMatch({
      ...base,
      trustpilotRating: 3.9,
      trustpilotReviewCount: undefined
    });
    expect(match.displayable).toBe(true);
    expect(match.rating).toBe(3.9);
  });
});
