import { describe, expect, it } from "vitest";
import { mergeReviewSignalsWithEnrichment } from "@/lib/reviewSignals/mergeEnrichment";
import type { ReviewSignals } from "@/lib/reviewSignals";
import type { ReputationEnrichment } from "@/lib/outscraper/reputation";

const baseSignals: ReviewSignals = {
  googleFound: false,
  trustpilotFound: false,
  suspiciousReviewSignals: [],
  sources: [],
  warnings: [],
  publicReviewAvailabilityNotes: [],
  reviewFetchDebug: []
};

describe("mergeReviewSignalsWithEnrichment", () => {
  it("promotes Outscraper google rating and count into displayable review signals", () => {
    const enrichment = {
      googleRating: 4.5,
      googleReviewCount: 250,
      trustpilotRating: null,
      trustpilotReviewCount: null
    } as ReputationEnrichment;

    const merged = mergeReviewSignalsWithEnrichment(baseSignals, enrichment);

    expect(merged.googleFound).toBe(true);
    expect(merged.googleRating).toBe(4.5);
    expect(merged.googleReviewCount).toBe(250);
  });

  it("shows Trustpilot when only rating is available", () => {
    const enrichment = {
      googleRating: null,
      googleReviewCount: null,
      trustpilotRating: 4.1,
      trustpilotReviewCount: null
    } as ReputationEnrichment;

    const merged = mergeReviewSignalsWithEnrichment(baseSignals, enrichment);

    expect(merged.trustpilotFound).toBe(true);
    expect(merged.trustpilotRating).toBe(4.1);
  });
});
