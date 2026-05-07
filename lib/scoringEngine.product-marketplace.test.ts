import { describe, expect, it } from "vitest";
import type { ProductMarketplaceSignals } from "@/lib/productMarketplaceSignals";
import { calculateScamScore } from "@/lib/scoringEngine";

function pm(overrides: Partial<ProductMarketplaceSignals>): ProductMarketplaceSignals {
  return {
    confidence: "low",
    matchedMarketplaces: [],
    matchedImageCount: 0,
    matchedProducts: [],
    riskSignals: [],
    warnings: [],
    ...overrides
  };
}

describe("product marketplace image scoring", () => {
  it("keeps minor overlap low impact for legit private-label profile", () => {
    const result = calculateScamScore({
      domain: "private-label-clean.com",
      heuristicReasons: [],
      websiteText: "Established store with clear identity and normal policies.",
      reviewSignals: {
        googleFound: true,
        googleRating: 4.5,
        googleReviewCount: 240,
        trustpilotFound: true,
        trustpilotRating: 4.4,
        trustpilotReviewCount: 180,
        suspiciousReviewSignals: [],
        sources: ["fixture"],
        warnings: []
      },
      productMarketplaceSignals: pm({
        confidence: "low",
        matchedMarketplaces: ["Amazon"],
        matchedImageCount: 1,
        matchedProducts: [{ marketplace: "Amazon", similarityScore: 0.71 }]
      })
    });
    expect(result.finalScore).toBeLessThan(35);
    expect(result.riskLabels).not.toContain("Possible dropshipping products");
  });

  it("raises strong signal for fake luxury/local branding with supplier image overlap", () => {
    const result = calculateScamScore({
      domain: "amsterdam-luxe-fast.com",
      heuristicReasons: [],
      websiteText:
        "Luxury Amsterdam brand. Return to China warehouse. Shipping 10-20 business days. Formerly known as another label.",
      reviewSignals: {
        googleFound: true,
        googleRating: 3.0,
        googleReviewCount: 90,
        trustpilotFound: true,
        trustpilotRating: 2.9,
        trustpilotReviewCount: 120,
        suspiciousReviewSignals: ["dropshipping complaints", "return to china", "bad quality"],
        sources: ["fixture"],
        warnings: []
      },
      supplyChainSignals: {
        likelyDropshipping: true,
        likelyChinaShipping: true,
        likelyLocalProduction: false,
        confidence: "high",
        dropshipConfidence: "high",
        chinaConfidence: "high",
        localConfidence: "low",
        reasons: ["fixture"],
        scoreAdjustment: 28
      },
      productMarketplaceSignals: pm({
        confidence: "high",
        matchedMarketplaces: ["AliExpress", "Temu"],
        matchedImageCount: 5,
        matchedProducts: [
          { marketplace: "AliExpress", similarityScore: 0.93 },
          { marketplace: "Temu", similarityScore: 0.9 }
        ],
        riskSignals: ["Multiple product images match supplier marketplaces"]
      })
    });
    expect(result.finalScore).toBeGreaterThanOrEqual(45);
    expect(result.riskLabels).toEqual(
      expect.arrayContaining([
        "Possible marketplace reseller",
        "Supplier product images detected",
        "Product images found on external marketplaces"
      ])
    );
  });

  it("treats one generic match as weak evidence", () => {
    const result = calculateScamScore({
      domain: "generic-single-match.com",
      heuristicReasons: [],
      websiteText: "Normal ecommerce store.",
      productMarketplaceSignals: pm({
        confidence: "low",
        matchedMarketplaces: ["Amazon"],
        matchedImageCount: 1,
        matchedProducts: [{ marketplace: "Amazon", similarityScore: 0.68 }]
      })
    });
    expect(result.signals.some((s) => s.id === "product-marketplace-weak-match")).toBe(true);
    expect(result.signals.some((s) => s.id === "product-marketplace-overlap")).toBe(false);
  });

  it("significantly increases risk when image overlap stacks with bad reviews and weak identity", () => {
    const result = calculateScamScore({
      domain: "stacked-risk-marketplace.com",
      heuristicReasons: [],
      websiteText: "Amsterdam premium label with no legal entity listed and return to china.",
      reviewSignals: {
        googleFound: true,
        googleRating: 2.8,
        googleReviewCount: 80,
        trustpilotFound: true,
        trustpilotRating: 2.7,
        trustpilotReviewCount: 110,
        suspiciousReviewSignals: ["dropshipping complaints", "refund denied", "delayed shipping"],
        sources: ["fixture"],
        warnings: []
      },
      productMarketplaceSignals: pm({
        confidence: "high",
        matchedMarketplaces: ["AliExpress", "DHgate", "Temu"],
        matchedImageCount: 6,
        matchedProducts: [{ marketplace: "AliExpress", similarityScore: 0.94 }],
        riskSignals: [
          "Multiple product images match supplier marketplaces",
          "Luxury/local brand positioning conflicts with marketplace sourcing patterns"
        ]
      })
    });
    expect(result.finalScore).toBeGreaterThanOrEqual(45);
    expect(result.riskLabels).toContain("Possible marketplace reseller");
  });
});
