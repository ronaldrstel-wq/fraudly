import { describe, expect, it } from "vitest";
import type { ReputationEnrichment } from "@/lib/outscraper/reputation";
import type { ReviewSignals } from "@/lib/reviewSignals";
import {
  mergeEnrichmentForCache,
  resolveReputationProviders,
  reputationSourceConfidenceLabel
} from "@/lib/reputation/reputationProviderResolver";

const baseSignals: ReviewSignals = {
  googleFound: false,
  trustpilotFound: false,
  suspiciousReviewSignals: [],
  sources: [],
  warnings: [],
  publicReviewAvailabilityNotes: [],
  reviewFetchDebug: []
};

function enrichment(partial: Partial<ReputationEnrichment>): ReputationEnrichment {
  return {
    normalizedDomain: "example.com",
    providerState: "found",
    googleRating: null,
    googleReviewCount: null,
    trustpilotRating: null,
    trustpilotReviewCount: null,
    googleMatchConfidence: "none",
    trustpilotMatchConfidence: "none",
    ...partial
  } as ReputationEnrichment;
}

describe("reputationProviderResolver", () => {
  it("prefers verified Outscraper Google over indexed baseline", () => {
    const resolved = resolveReputationProviders({
      domain: "example.com",
      baseReviewSignals: {
        ...baseSignals,
        googleRating: 3.2,
        googleReviewCount: 10
      },
      enrichment: enrichment({
        googleRating: 4.8,
        googleReviewCount: 400,
        googleMatchConfidence: "high",
        googleLookup: {
          provider: "outscraper",
          queryUsed: "example.com",
          confidence: "high",
          confidenceScore: 1,
          exactDomainMatch: true,
          httpStatus: 200
        }
      })
    });

    expect(resolved.displaySource.google).toBe("google_outscraper");
    expect(resolved.google.display.showMetrics).toBe(true);
    expect(resolved.google.display.usedInTrustScore).toBe(true);
    expect(resolved.google.display.rating).toBe(4.8);
  });

  it("keeps indexed Google when Outscraper validation fails", () => {
    const resolved = resolveReputationProviders({
      domain: "example.com",
      baseReviewSignals: {
        ...baseSignals,
        googleRating: 4.1,
        googleReviewCount: 88
      },
      enrichment: enrichment({
        googleRating: 2,
        googleReviewCount: 5,
        googleMatchConfidence: "low",
        googleLookup: {
          provider: "outscraper",
          queryUsed: "example.com",
          confidence: "low",
          confidenceScore: 0.1,
          exactDomainMatch: false,
          httpStatus: 200
        }
      })
    });

    expect(resolved.google.display.showMetrics).toBe(true);
    expect(resolved.google.display.displayState).toBe("limited");
    expect(resolved.google.display.usedInTrustScore).toBe(false);
    expect(resolved.google.display.rating).toBe(4.1);
  });

  it("marks Trustpilot exact domain match as verified for scoring", () => {
    const resolved = resolveReputationProviders({
      domain: "example.com",
      enrichment: enrichment({
        trustpilotRating: 4.6,
        trustpilotReviewCount: 120,
        trustpilotMatchConfidence: "high",
        trustpilotLookup: {
          provider: "outscraper",
          lookupMode: "domain",
          queryUsed: "example.com",
          confidence: "high",
          attemptedQueries: ["example.com"],
          attemptedQueriesCount: 1,
          httpStatus: 200
        }
      })
    });

    expect(resolved.trustpilot.display.usedInTrustScore).toBe(true);
    expect(resolved.scoringSource.trustpilot).toBe("trustpilot_outscraper");
  });

  it("shows Trustpilot company-name match as limited without score impact", () => {
    const resolved = resolveReputationProviders({
      domain: "example.com",
      enrichment: enrichment({
        trustpilotRating: 4.2,
        trustpilotReviewCount: 40,
        trustpilotMatchConfidence: "medium"
      })
    });

    expect(resolved.mergedReviewSignals.trustpilotFound).toBe(true);
    expect(resolved.mergedReviewSignals.trustpilotRating).toBe(4.2);
    expect(resolved.trustpilot.display.usedInTrustScore).toBe(false);
  });

  it("does not overwrite good cache with empty failed fetch", () => {
    const existing = enrichment({
      providerState: "found",
      googleRating: 4.5,
      googleReviewCount: 200,
      googleMatchConfidence: "high",
      googleLookup: {
        provider: "outscraper",
        queryUsed: "example.com",
        confidence: "high",
        confidenceScore: 1,
        exactDomainMatch: true,
        httpStatus: 200
      }
    });
    const incoming = enrichment({
      providerState: "failed",
      googleRating: null,
      googleReviewCount: null,
      googleMatchConfidence: "none"
    });

    const merged = mergeEnrichmentForCache(incoming, existing);
    expect(merged.googleRating).toBe(4.5);
    expect(merged.googleReviewCount).toBe(200);
    expect(merged.providerState).toBe("found");
  });

  it("labels Google Reviews as Limited for unvalidated metrics", () => {
    const label = reputationSourceConfidenceLabel("Google Reviews", {
      displayState: "limited",
      usedInTrustScore: false,
      found: true,
      showMetrics: true
    });
    expect(label).toBe("Google Reviews · Limited");
  });

  it("returns unavailable when no provider data exists", () => {
    const resolved = resolveReputationProviders({
      domain: "example.com",
      enrichment: enrichment({ providerState: "no_match" })
    });
    expect(resolved.google.display.displayState).toBe("none");
    expect(resolved.trustpilot.display.displayState).toBe("none");
  });
});
