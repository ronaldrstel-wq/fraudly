import { describe, expect, it } from "vitest";
import type { ReviewSignals } from "@/lib/reviewSignals";
import type { SupplyChainSignals } from "@/lib/supplyChainSignals";
import { calculateScamScore, type ScoreSignal } from "@/lib/scoringEngine";
import { trustLevelFromScore, trustScoreFromRisk } from "@/lib/trustSystem";

function reviewBase(overrides: Partial<ReviewSignals>): ReviewSignals {
  return {
    googleFound: false,
    trustpilotFound: false,
    suspiciousReviewSignals: [],
    sources: ["Synthetic regression fixture"],
    warnings: [],
    ...overrides
  };
}

function supplyBase(overrides: Partial<SupplyChainSignals>): SupplyChainSignals {
  return {
    likelyDropshipping: false,
    likelyChinaShipping: false,
    likelyLocalProduction: false,
    confidence: "low",
    dropshipConfidence: "low",
    chinaConfidence: "low",
    localConfidence: "low",
    reasons: ["fixture"],
    scoreAdjustment: 0,
    ...overrides
  };
}

describe("ecommerce scoring regression set", () => {
  it("profile 1: clean legitimate store => high trust / low risk not driven by SSL only", () => {
    const externalSignals: ScoreSignal[] = [
      {
        id: "intel-valid-ssl",
        label: "Valid TLS certificate observed",
        category: "website_quality",
        impact: -3,
        confidence: "high",
        reason: "HTTPS handshake succeeded with a trusted certificate.",
        source: "TLS certificate check"
      }
    ];
    const result = calculateScamScore({
      domain: "cleanbrand.nl",
      heuristicReasons: [],
      reviewSignals: reviewBase({
        googleFound: true,
        googleRating: 4.4,
        googleReviewCount: 320,
        trustpilotFound: true,
        trustpilotRating: 4.5,
        trustpilotReviewCount: 410
      }),
      supplyChainSignals: supplyBase({
        likelyLocalProduction: true,
        localConfidence: "high",
        confidence: "high",
        scoreAdjustment: -10
      }),
      websiteText:
        "Official Dutch brand in Amsterdam. KvK 12345678 and VAT NL123456789B01. " +
        "Returns within 30 days to local address in Netherlands. Refund in 5 business days. " +
        "Shipping in 1-3 business days from NL warehouse.",
      externalSignals
    });

    const trustScore = trustScoreFromRisk(result.finalScore);
    expect(trustLevelFromScore(trustScore)).toBe("trusted");
    expect(result.finalScore).toBeLessThanOrEqual(25);
    expect(result.signalSources.length).toBeGreaterThan(0);
    expect(result.confidence).toMatch(/medium|high/);
  });

  it("profile 2: mixed-signal ecommerce => medium risk, not auto-trusted", () => {
    const result = calculateScamScore({
      domain: "mixedsignals-store.com",
      heuristicReasons: [],
      reviewSignals: reviewBase({
        googleFound: true,
        googleRating: 4.4,
        googleReviewCount: 520,
        trustpilotFound: true,
        trustpilotRating: 4.2,
        trustpilotReviewCount: 460,
        suspiciousReviewSignals: ["Some customers mention delayed shipping", "Some customers mention mixed product quality"]
      }),
      supplyChainSignals: supplyBase({
        likelyDropshipping: false,
        dropshipConfidence: "low",
        likelyLocalProduction: true,
        localConfidence: "medium",
        confidence: "medium",
        scoreAdjustment: -8
      }),
      websiteText:
        "Premium London-inspired store with secure checkout. Shipping usually takes 5-8 business days in busy periods. " +
        "Returns accepted and refunds may take up to 10 business days after inspection."
    });

    const trustScore = trustScoreFromRisk(result.finalScore);
    expect(trustLevelFromScore(trustScore)).toBe("caution");
    expect(result.finalScore).toBeGreaterThanOrEqual(20);
    expect(result.finalScore).toBeLessThanOrEqual(65);
    expect(Array.isArray(result.riskLabels)).toBe(true);
    expect(Array.isArray(result.signalSources)).toBe(true);
    expect(result.confidence).toMatch(/medium|high/);
  });

  it("profile 3: high-risk rebrand dropshipping => medium-high/high risk with explicit labels", () => {
    const result = calculateScamScore({
      domain: "rebrand-fastdeal.com",
      heuristicReasons: [],
      reviewSignals: reviewBase({
        googleFound: true,
        googleRating: 4.4,
        googleReviewCount: 1500,
        trustpilotFound: true,
        trustpilotRating: 4.3,
        trustpilotReviewCount: 1300,
        suspiciousReviewSignals: [
          "Dropshipping complaints and AliExpress products",
          "Return to China and no refund cases",
          "Bad quality and delayed shipping",
          "Fake Amsterdam / Dutch brand",
          "Generic 5-star pattern and review spike",
          "Misleading ads"
        ]
      }),
      supplyChainSignals: supplyBase({
        likelyDropshipping: true,
        likelyChinaShipping: true,
        dropshipConfidence: "high",
        chinaConfidence: "high",
        confidence: "high",
        scoreAdjustment: 30
      }),
      websiteText:
        "Amsterdam fashion brand. Formerly known as Urban Label House and now operating under multiple domains. " +
        "Shipping 10-20 business days. Return to China warehouse at customer cost. No refunds for final sale. " +
        "Up to 90% off closing down sale.",
      externalSignals: [
        {
          id: "intel-valid-ssl",
          label: "Valid TLS certificate observed",
          category: "website_quality",
          impact: -3,
          confidence: "high",
          reason: "HTTPS handshake succeeded with a trusted certificate.",
          source: "TLS certificate check"
        }
      ]
    });

    // SSL/design and strong positive volume must not overpower major risk patterns.
    expect(result.finalScore).toBeGreaterThanOrEqual(45);
    expect(trustLevelFromScore(trustScoreFromRisk(result.finalScore))).not.toBe("trusted");

    expect(result.riskLabels).toEqual(
      expect.arrayContaining([
        "Possible dropshipping store",
        "Possible rebrand",
        "Return policy risk",
        "Brand location mismatch",
        "High complaint volume"
      ])
    );
    expect(result.signalSources.length).toBeGreaterThan(0);
    expect(result.confidence).toBe("high");
  });
});

