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
      googleMatchConfidence: "high",
      googleLookup: {
        provider: "outscraper",
        queryUsed: "example.com",
        confidence: "high",
        confidenceScore: 1,
        exactDomainMatch: true,
        httpStatus: 200
      },
      trustpilotRating: null,
      trustpilotReviewCount: null,
      trustpilotMatchConfidence: "none"
    } as ReputationEnrichment;

    const merged = mergeReviewSignalsWithEnrichment(baseSignals, enrichment);

    expect(merged.googleFound).toBe(true);
    expect(merged.googleRating).toBe(4.5);
    expect(merged.googleReviewCount).toBe(250);
  });

  it("shows Trustpilot when only rating is available with medium confidence", () => {
    const enrichment = {
      googleRating: null,
      googleReviewCount: null,
      trustpilotRating: 4.1,
      trustpilotReviewCount: null,
      trustpilotMatchConfidence: "medium"
    } as ReputationEnrichment;

    const merged = mergeReviewSignalsWithEnrichment(baseSignals, enrichment);

    expect(merged.trustpilotFound).toBe(true);
    expect(merged.trustpilotRating).toBe(4.1);
    expect(merged.trustpilotMatchNote).toContain("moderate confidence");
  });

  it("does not merge Google enrichment without exact domain validation", () => {
    const enrichment = {
      googleRating: 2,
      googleReviewCount: 30,
      googleMatchConfidence: "low",
      googleLookup: {
        provider: "outscraper",
        queryUsed: "letsfoil.nl",
        confidence: "low",
        confidenceScore: 0.15,
        exactDomainMatch: false,
        httpStatus: 200
      },
      trustpilotRating: null,
      trustpilotReviewCount: null,
      trustpilotMatchConfidence: "none"
    } as ReputationEnrichment;

    const merged = mergeReviewSignalsWithEnrichment(baseSignals, enrichment);
    expect(merged.googleFound).toBe(false);
    expect(merged.googleRating).toBeUndefined();
    expect(merged.googleMatchConfidence).toBe("low");
  });

  it("keeps base indexed Google when enrichment validation fails", () => {
    const enrichment = {
      googleRating: 1.5,
      googleReviewCount: 3,
      googleMatchConfidence: "low",
      googleLookup: {
        provider: "outscraper",
        queryUsed: "example.com",
        confidence: "low",
        confidenceScore: 0.1,
        exactDomainMatch: false,
        httpStatus: 200
      },
      trustpilotMatchConfidence: "none"
    } as ReputationEnrichment;

    const merged = mergeReviewSignalsWithEnrichment(
      {
        ...baseSignals,
        googleRating: 4.2,
        googleReviewCount: 95
      },
      enrichment
    );

    expect(merged.googleFound).toBe(true);
    expect(merged.googleRating).toBe(4.2);
    expect(merged.googleReviewCount).toBe(95);
    expect(merged.googleMatchConfidence).toBe("none");
  });

  it("does not merge low-confidence Trustpilot enrichment", () => {
    const enrichment = {
      googleRating: null,
      googleReviewCount: null,
      trustpilotRating: 4.9,
      trustpilotReviewCount: 50,
      trustpilotMatchConfidence: "low"
    } as ReputationEnrichment;

    const merged = mergeReviewSignalsWithEnrichment(baseSignals, enrichment);
    expect(merged.trustpilotFound).toBe(false);
    expect(merged.trustpilotRating).toBeUndefined();
  });
});
