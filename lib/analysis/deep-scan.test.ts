import { describe, expect, it } from "vitest";
import { calculateScamScore } from "@/lib/scoringEngine";

describe("deep scan trigger heuristic", () => {
  it("supports mixed-risk ecommerce investigation path", () => {
    const score = calculateScamScore({
      domain: "mixed-risk-shop.com",
      heuristicReasons: [],
      websiteText: "Shipping 7-21 business days. Returns policy and refund terms available.",
      reviewSignals: {
        googleFound: true,
        googleRating: 3.9,
        googleReviewCount: 80,
        trustpilotFound: false,
        suspiciousReviewSignals: ["some delayed shipping complaints"],
        sources: ["fixture"],
        warnings: []
      }
    });
    expect(score.finalScore).toBeGreaterThanOrEqual(15);
  });
});

