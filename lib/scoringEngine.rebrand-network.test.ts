import { describe, expect, it } from "vitest";
import { calculateScamScore } from "@/lib/scoringEngine";
import { trustLevelFromScore, trustScoreFromRisk } from "@/lib/trustSystem";

describe("rebrand network mapping", () => {
  it("does not strongly flag unrelated generic Shopify stores", () => {
    const result = calculateScamScore({
      domain: "simple-store-a.com",
      heuristicReasons: [],
      websiteText:
        "Built on Shopify theme. Secure checkout. Uses Google Analytics and Meta Pixel. Standard cookie banner.",
      reviewSignals: {
        googleFound: true,
        googleRating: 4.5,
        googleReviewCount: 210,
        trustpilotFound: false,
        suspiciousReviewSignals: [],
        sources: ["fixture"],
        warnings: []
      }
    });

    expect(result.rebrandNetworkSignals.confidence).toBe("low");
    expect(result.riskLabels).not.toContain("Possible rebrand network");
    expect(result.signals.some((s) => s.id === "rebrand-network-overlap")).toBe(false);
  });

  it("flags related stores with shared policy text + same email + same return address", () => {
    const result = calculateScamScore({
      domain: "labelhouse-amsterdam.com",
      heuristicReasons: [],
      websiteText:
        "This same shipping policy applies to our partner stores iconicstreetwear.com and urbanlabelstore.nl. " +
        "Support: support@brandgroup-help.com. Return address: No. 8 Longhua Rd Shenzhen China warehouse address. " +
        "Formerly known as Label House Originals.",
      reviewSignals: {
        googleFound: true,
        googleRating: 3.3,
        googleReviewCount: 70,
        trustpilotFound: true,
        trustpilotRating: 3.1,
        trustpilotReviewCount: 120,
        suspiciousReviewSignals: ["slow shipping complaints"],
        sources: ["fixture"],
        warnings: []
      }
    });

    expect(result.relatedDomains.length).toBeGreaterThan(0);
    expect(result.rebrandNetworkSignals.matchedSignals.length).toBeGreaterThanOrEqual(2);
    expect(result.rebrandNetworkSignals.confidence).toMatch(/medium|high/);
    expect(result.riskLabels).toContain("Possible rebrand network");
    expect(result.riskLabels).toContain("Related stores detected");
    expect(result.riskLabels).toContain("Shared policy text detected");
    expect(result.riskLabels).toContain("Previous brand/domain indicators");
  });

  it("drops trust significantly for high-risk dropship rebrand network", () => {
    const result = calculateScamScore({
      domain: "amsterdamtrendline.com",
      heuristicReasons: [],
      websiteText:
        "Amsterdam premium brand. Formerly known as Urban Trendline. Policy applies to our partner stores fastlabelhub.com and icondistrict.shop. " +
        "Same shipping and refund policy across our brands. Return to China warehouse and customer pays return shipping. " +
        "Product photos and descriptions are shared with marketplace suppliers. 90% off closing down sale.",
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
      },
      reviewSignals: {
        googleFound: true,
        googleRating: 4.4,
        googleReviewCount: 1200,
        trustpilotFound: true,
        trustpilotRating: 4.2,
        trustpilotReviewCount: 980,
        suspiciousReviewSignals: [
          "dropshipping complaints",
          "return to china no refund",
          "generic 5-star review spike",
          "misleading ads"
        ],
        sources: ["fixture"],
        warnings: []
      }
    });

    // Positive volume + clean storefront should not cancel overlapping strong network risk.
    expect(result.finalScore).toBeGreaterThanOrEqual(45);
    expect(trustLevelFromScore(trustScoreFromRisk(result.finalScore))).not.toBe("trusted");
    expect(result.riskLabels).toEqual(
      expect.arrayContaining([
        "Possible rebrand network",
        "Possible dropshipping store",
        "Return policy risk",
        "High complaint volume"
      ])
    );
  });

  it("keeps partial weak matches at low confidence with minimal impact", () => {
    const result = calculateScamScore({
      domain: "partial-match-store.com",
      heuristicReasons: [],
      websiteText: "Uses cookieyes and google analytics. Standard terms page.",
      reviewSignals: {
        googleFound: true,
        googleRating: 4.3,
        googleReviewCount: 160,
        trustpilotFound: false,
        suspiciousReviewSignals: [],
        sources: ["fixture"],
        warnings: []
      }
    });

    expect(result.rebrandNetworkSignals.confidence).toBe("low");
    expect(result.signals.some((s) => s.id === "rebrand-network-overlap")).toBe(false);
    expect(result.signals.some((s) => s.id === "rebrand-network-weak-hint")).toBe(true);
    expect(result.finalScore).toBeLessThan(35);
  });
});

