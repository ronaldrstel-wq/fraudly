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

  it("triggers when confidence is low", () => {
    expect(shouldTriggerOutscraper({ baseRiskScore: 15, deepScan: false, confidenceLevel: "low" })).toBe(true);
  });

  it("triggers when review signals are missing", () => {
    expect(shouldTriggerOutscraper({ baseRiskScore: 10, deepScan: false, missingReviewSignals: true })).toBe(true);
  });
});

describe("outscraper reputation impact", () => {
  it("caps impact so enrichment does not dominate total score", () => {
    const positive = calculateReputationImpactFromPayload({
      impactOnRisk: -50
    });

    const negative = calculateReputationImpactFromPayload({
      impactOnRisk: 80
    });

    expect(positive.impactOnRisk).toBeGreaterThanOrEqual(-15);
    expect(positive.impactOnRisk).toBeLessThanOrEqual(20);
    expect(negative.impactOnRisk).toBeGreaterThanOrEqual(-15);
    expect(negative.impactOnRisk).toBeLessThanOrEqual(20);
  });
});

