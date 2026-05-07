import { describe, expect, it } from "vitest";
import { calculateScamScore } from "@/lib/scoringEngine";
import { trustLevelFromScore, trustScoreFromRisk } from "@/lib/trustSystem";

describe("ecommerce risk weighting", () => {
  it("keeps major complaint + dropship + policy-risk stores out of Trusted", () => {
    const result = calculateScamScore({
      domain: "damlabels.com",
      heuristicReasons: [],
      reviewSignals: {
        googleFound: true,
        googleRating: 2.7,
        googleReviewCount: 146,
        trustpilotFound: true,
        trustpilotRating: 2.9,
        trustpilotReviewCount: 521,
        suspiciousReviewSignals: [
          "Many complaints mention dropshipping and return to china",
          "No refund accepted",
          "Bad quality and delayed shipping",
          "Fake Amsterdam / Dutch brand positioning",
          "Review spike and generic 5-star comments"
        ],
        sources: ["Google Places API (searchText)", "Trustpilot aggregate"],
        warnings: []
      },
      websiteText:
        "Amsterdam style brand. Shipping takes 10-20 business days and customs duties may apply. " +
        "Customer pays return shipping. Return to China warehouse. No refunds on sale items. " +
        "Formerly known as another brand. Partner domains: iconiclondonbrand.com urban-labels.shop",
      supplyChainSignals: {
        likelyDropshipping: true,
        likelyChinaShipping: true,
        likelyLocalProduction: false,
        confidence: "high",
        dropshipConfidence: "high",
        chinaConfidence: "high",
        localConfidence: "low",
        reasons: ["long shipping windows", "china-linked returns"],
        scoreAdjustment: 30
      }
    });

    const trustScore = trustScoreFromRisk(result.finalScore);
    const trustLevel = trustLevelFromScore(trustScore);

    expect(result.finalScore).toBeGreaterThanOrEqual(45);
    expect(trustLevel).not.toBe("trusted");
    expect(result.riskLabels).toContain("Possible dropshipping store");
    expect(result.riskLabels).toContain("Return policy risk");
    expect(result.riskLabels).toContain("Brand location mismatch");
    expect(result.confidence).toMatch(/medium|high/);
  });
});

