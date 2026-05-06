import { describe, expect, it } from "vitest";
import { calculateScamScore } from "@/lib/scoringEngine";

describe("score breakdown and explanation", () => {
  it("SSL + clean design alone does not create very high trust", () => {
    const result = calculateScamScore({
      domain: "clean-ui-store.com",
      heuristicReasons: [],
      externalSignals: [
        {
          id: "intel-valid-ssl",
          label: "Valid TLS certificate observed",
          category: "website_quality",
          impact: -3,
          confidence: "high",
          reason: "HTTPS is enabled.",
          source: "TLS certificate check"
        },
        {
          id: "intel-no-feed-hits-composite",
          label: "No feed hits",
          category: "website_quality",
          impact: -2,
          confidence: "medium",
          reason: "No malware feed matches.",
          source: "Composite intelligence"
        }
      ],
      reviewSignals: {
        googleFound: false,
        trustpilotFound: false,
        suspiciousReviewSignals: [],
        sources: [],
        warnings: [],
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

    expect(result.scoreBreakdown.technicalSafety.score).toBeGreaterThan(result.scoreBreakdown.reputationReviews.score);
    expect(result.finalScore).toBeGreaterThanOrEqual(15);
  });

  it("high complaints create clear user explanation and caps", () => {
    const result = calculateScamScore({
      domain: "complaint-heavy-store.com",
      heuristicReasons: [],
      reviewSignals: {
        googleFound: true,
        googleRating: 2.4,
        googleReviewCount: 190,
        trustpilotFound: true,
        trustpilotRating: 2.8,
        trustpilotReviewCount: 240,
        suspiciousReviewSignals: ["No refund", "Delayed shipping", "Bad quality"],
        sources: ["Outscraper Google Reviews"],
        warnings: [],
        outscraper: {
          source: "Outscraper Google Reviews",
          available: true,
          rating: 2.4,
          reviewCount: 190,
          negativeReviewRatio: 0.5,
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
      },
      websiteText: "Return to China. Customer pays return shipping. No refunds on sale.",
      externalSignals: [
        {
          id: "test-strong-trust-push",
          label: "Strong synthetic trust push",
          category: "website_quality",
          impact: -40,
          confidence: "high",
          reason: "Synthetic strong trust weight for cap test.",
          source: "test"
        }
      ]
    });

    expect(result.userExplanation.mainReasons.length).toBeGreaterThan(0);
    expect(result.riskLabels).toContain("High complaint volume");
    expect(result.scoreCapsApplied.length).toBeGreaterThan(0);
  });
});

