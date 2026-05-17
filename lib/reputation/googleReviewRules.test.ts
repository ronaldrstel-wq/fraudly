import { describe, expect, it } from "vitest";
import { assessGoogleReviewEvidence } from "@/lib/reputation/googleReviewRules";
import { resolveGoogleReviewChannel } from "@/lib/reputation/reviewChannelPresentation";
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

describe("googleReviewRules", () => {
  it("classifies legacy public metrics without enrichment validation", () => {
    const ev = assessGoogleReviewEvidence({
      ...base,
      googleFound: true,
      googleRating: 4.5,
      googleReviewCount: 120
    });
    expect(ev.hasFullPublicMetrics).toBe(true);
    expect(ev.validated).toBe(false);
  });

  it("shows limited metrics for legacy Google data in channel presentation", () => {
    const channel = resolveGoogleReviewChannel({
      ...base,
      googleFound: true,
      googleRating: 4.5,
      googleReviewCount: 5000
    });
    expect(channel.found).toBe(true);
    expect(channel.showMetrics).toBe(true);
    expect(channel.displayState).toBe("limited");
    expect(channel.usedInTrustScore).toBe(false);
  });
});
