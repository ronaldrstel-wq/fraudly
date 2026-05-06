import { describe, expect, it } from "vitest";
import {
  calculateReputationImpactFromPayload,
  shouldTriggerOutscraper
} from "@/lib/outscraper/reputation";

describe("outscraper enrichment trigger policy", () => {
  it("triggers for uncertain baseline (40-80)", () => {
    expect(shouldTriggerOutscraper({ baseRiskScore: 40, deepScan: false })).toBe(true);
    expect(shouldTriggerOutscraper({ baseRiskScore: 65, deepScan: false })).toBe(true);
    expect(shouldTriggerOutscraper({ baseRiskScore: 80, deepScan: false })).toBe(true);
  });

  it("triggers for deep scan even outside uncertain range", () => {
    expect(shouldTriggerOutscraper({ baseRiskScore: 15, deepScan: true })).toBe(true);
  });
});

describe("outscraper reputation impact", () => {
  it("caps impact so enrichment does not dominate total score", () => {
    const positive = calculateReputationImpactFromPayload({
      trustpilotRating: 4.8,
      trustpilotReviewCount: 1200,
      googleRating: 4.7,
      googleReviewCount: 3500,
      latestReviewDate: "2022-01-01T00:00:00.000Z",
      sentimentSummary: null,
      businessName: "Apple",
      businessNameMatch: true,
      reviewSpikeSuspected: false
    });

    const negative = calculateReputationImpactFromPayload({
      trustpilotRating: 2.2,
      trustpilotReviewCount: 200,
      googleRating: 2.4,
      googleReviewCount: 180,
      latestReviewDate: null,
      sentimentSummary: null,
      businessName: "Totally Different Name",
      businessNameMatch: false,
      reviewSpikeSuspected: true
    });

    expect(positive.impactOnRisk).toBeGreaterThanOrEqual(-15);
    expect(positive.impactOnRisk).toBeLessThanOrEqual(15);
    expect(negative.impactOnRisk).toBeGreaterThanOrEqual(-15);
    expect(negative.impactOnRisk).toBeLessThanOrEqual(15);
  });
});

