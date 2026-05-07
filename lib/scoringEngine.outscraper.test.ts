import { describe, expect, it } from "vitest";
import { calculateScamScore } from "@/lib/scoringEngine";
import { trustLevelFromScore, trustScoreFromRisk } from "@/lib/trustSystem";

describe("outscraper scoring integration", () => {
  it("strong negative Outscraper profile lowers trust", () => {
    const result = calculateScamScore({
      domain: "bad-reputation-shop.com",
      heuristicReasons: [],
      reviewSignals: {
        googleFound: true,
        googleRating: 4.5,
        googleReviewCount: 700,
        trustpilotFound: false,
        suspiciousReviewSignals: ["Outscraper themes include refund/shipping complaints"],
        sources: ["Outscraper Google Reviews"],
        warnings: [],
        outscraper: {
          source: "Outscraper Google Reviews",
          available: true,
          rating: 2.5,
          reviewCount: 190,
          negativeReviewRatio: 0.48,
          strongestComplaintThemes: ["refund/returns", "shipping delays"],
          confidence: "high",
          negativeTrend: true,
          suspiciousPositivePattern: false,
          businessIdentityMismatch: false,
          businessAddress: null,
          businessPhone: null,
          businessCategory: null,
          websiteMatch: null
        }
      }
    });

    expect(result.riskLabels).toEqual(
      expect.arrayContaining(["High complaint volume", "Negative review trend"])
    );
    expect(result.signalSources).toContain("Outscraper Google Reviews");
    expect(trustLevelFromScore(trustScoreFromRisk(result.finalScore))).not.toBe("trusted");
  });

  it("high rating with suspicious pattern does not over-trust", () => {
    const result = calculateScamScore({
      domain: "spiky-positive-reviews.com",
      heuristicReasons: [],
      reviewSignals: {
        googleFound: true,
        googleRating: 4.7,
        googleReviewCount: 1200,
        trustpilotFound: false,
        suspiciousReviewSignals: ["Suspicious positive-review spike pattern in Outscraper profile"],
        sources: ["Outscraper Google Reviews"],
        warnings: [],
        outscraper: {
          source: "Outscraper Google Reviews",
          available: true,
          rating: 4.7,
          reviewCount: 1200,
          negativeReviewRatio: 0.09,
          strongestComplaintThemes: [],
          confidence: "high",
          negativeTrend: false,
          suspiciousPositivePattern: true,
          businessIdentityMismatch: false,
          businessAddress: null,
          businessPhone: null,
          businessCategory: null,
          websiteMatch: true
        }
      }
    });

    expect(result.riskLabels).toContain("Suspicious review pattern");
    expect(result.finalScore).toBeGreaterThanOrEqual(20);
  });

  it("missing Outscraper data falls back safely", () => {
    const result = calculateScamScore({
      domain: "no-outscraper-data.com",
      heuristicReasons: [],
      reviewSignals: {
        googleFound: false,
        trustpilotFound: false,
        suspiciousReviewSignals: [],
        sources: [],
        warnings: ["Outscraper data unavailable"],
        outscraper: {
          source: "Outscraper Google Reviews",
          available: false,
          rating: null,
          reviewCount: null,
          negativeReviewRatio: null,
          strongestComplaintThemes: [],
          confidence: "low",
          negativeTrend: false,
          suspiciousPositivePattern: false,
          businessIdentityMismatch: false,
          businessAddress: null,
          businessPhone: null,
          businessCategory: null,
          websiteMatch: null
        }
      }
    });

    expect(result.outscraperReputation?.available).toBe(false);
    expect(result.finalScore).toBeGreaterThanOrEqual(0);
    expect(result.finalScore).toBeLessThanOrEqual(100);
  });

  it("Outscraper business identity mismatch increases risk", () => {
    const result = calculateScamScore({
      domain: "identity-mismatch-reviews.com",
      heuristicReasons: [],
      reviewSignals: {
        googleFound: true,
        googleRating: 4.2,
        googleReviewCount: 300,
        trustpilotFound: false,
        suspiciousReviewSignals: ["Outscraper business identity mismatch with domain"],
        sources: ["Outscraper Google Reviews"],
        warnings: [],
        outscraper: {
          source: "Outscraper Google Reviews",
          available: true,
          rating: 4.2,
          reviewCount: 300,
          negativeReviewRatio: 0.12,
          strongestComplaintThemes: [],
          confidence: "high",
          negativeTrend: false,
          suspiciousPositivePattern: false,
          businessIdentityMismatch: true,
          businessAddress: null,
          businessPhone: null,
          businessCategory: null,
          websiteMatch: false
        }
      }
    });

    expect(result.riskLabels).toContain("Business identity mismatch");
    expect(result.signals.some((s) => s.id === "reviews-outscraper-identity-mismatch")).toBe(true);
  });

  it("SSL/design cannot overpower bad Outscraper reputation", () => {
    const result = calculateScamScore({
      domain: "ssl-clean-but-bad-reviews.com",
      heuristicReasons: [],
      reviewSignals: {
        googleFound: true,
        googleRating: 4.6,
        googleReviewCount: 500,
        trustpilotFound: false,
        suspiciousReviewSignals: ["High complaint volume in Outscraper Google Reviews profile"],
        sources: ["Outscraper Google Reviews"],
        warnings: [],
        outscraper: {
          source: "Outscraper Google Reviews",
          available: true,
          rating: 2.4,
          reviewCount: 210,
          negativeReviewRatio: 0.52,
          strongestComplaintThemes: ["refund/returns"],
          confidence: "high",
          negativeTrend: true,
          suspiciousPositivePattern: false,
          businessIdentityMismatch: false,
          businessAddress: null,
          businessPhone: null,
          businessCategory: null,
          websiteMatch: true
        }
      },
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

    expect(result.finalScore).toBeGreaterThanOrEqual(40);
    expect(trustLevelFromScore(trustScoreFromRisk(result.finalScore))).not.toBe("trusted");
  });
});

