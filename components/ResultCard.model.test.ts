import { describe, expect, it } from "vitest";
import {
  buildConsumerSummary,
  getScoreUiModel,
  isTechnicalDetailsCollapsedByDefault,
  shouldAutoTriggerDeepScan,
  simplifyTechnicalText,
  splitSignalsForDisplay
} from "@/components/ResultCard";

describe("ResultCard score ui model", () => {
  it("renders safely with missing breakdown fields", () => {
    const model = getScoreUiModel(undefined);
    expect(model.confidence).toBe("low");
    expect(model.riskLabels).toEqual([]);
    expect(model.riskLabelDetails).toEqual([]);
    expect(model.scoreCapsApplied).toEqual([]);
    expect(model.scoreBreakdown).toBeUndefined();
  });

  it("auto-triggers deep scan for suspicious ecommerce signals", () => {
    const shouldTrigger = shouldAutoTriggerDeepScan({
      score: 42,
      trustSignals: [{ type: "danger", title: "Risk", description: "High risk", confidence: "high" }],
      supplyChainSignals: { likelyDropshipping: true, likelyChinaShipping: false, likelyLocalProduction: false },
      scoreResult: { riskLabels: ["Possible dropshipping store"] }
    } as unknown as import("@/types/scam").ScamCheckResult);
    expect(shouldTrigger).toBe(true);
  });

  it("does not auto-trigger deep scan for low-risk profile", () => {
    const shouldTrigger = shouldAutoTriggerDeepScan({
      score: 12,
      trustSignals: [{ type: "positive", title: "Positive", description: "Looks normal", confidence: "medium" }],
      supplyChainSignals: { likelyDropshipping: false, likelyChinaShipping: false, likelyLocalProduction: true },
      scoreResult: { riskLabels: [] }
    } as unknown as import("@/types/scam").ScamCheckResult);
    expect(shouldTrigger).toBe(false);
  });

  it("keeps technical details collapsed by default", () => {
    expect(isTechnicalDetailsCollapsedByDefault()).toBe(true);
  });

  it("simplifies technical phrasing for consumers", () => {
    expect(simplifyTechnicalText("Valid TLS certificate detected")).toContain("encrypted HTTPS");
    expect(simplifyTechnicalText("Google Safe Browsing not configured")).toContain("unavailable");
  });

  it("separates unavailable checks from positive signals", () => {
    const split = splitSignalsForDisplay([
      { type: "positive", title: "Valid TLS certificate detected", description: "Valid TLS certificate detected" },
      { type: "positive", title: "Google Safe Browsing not configured", description: "not configured" }
    ] as unknown as import("@/lib/checks/types").TrustSignal[]);
    expect(split.positives.length).toBe(1);
    expect(split.unavailable.length).toBe(1);
  });

  it("builds user-friendly summary lines", () => {
    const summary = buildConsumerSummary({
      reasons: ["No OpenPhish feed match", "Valid TLS certificate detected"],
      scoreResult: { userExplanation: { mainReasons: ["Google Safe Browsing not configured"], recommendation: "Use caution" } }
    } as unknown as import("@/types/scam").ScamCheckResult);
    expect(summary.why[0]).toContain("unavailable");
    expect(typeof summary.recommendation).toBe("string");
  });
});

