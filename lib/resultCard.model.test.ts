import { describe, expect, it } from "vitest";
import {
  buildConsumerSummary,
  getScoreUiModel,
  isTechnicalDetailsCollapsedByDefault,
  simplifyTechnicalText,
  splitSignalsForDisplay
} from "@/components/ResultCard";
import type { ScamCheckResult } from "@/types/scam";
import type { TrustSignal } from "@/lib/checks/types";

describe("ResultCard UX model helpers", () => {
  it("renders safely with missing score model fields", () => {
    const model = getScoreUiModel(undefined);
    expect(model.confidence).toBe("low");
    expect(model.riskLabels).toEqual([]);
  });

  it("keeps technical details collapsed by default", () => {
    expect(isTechnicalDetailsCollapsedByDefault()).toBe(true);
  });

  it("simplifies technical terms to plain language", () => {
    expect(simplifyTechnicalText("Valid TLS certificate detected")).toContain("encrypted HTTPS");
    expect(simplifyTechnicalText("Google Safe Browsing not configured")).toContain("unavailable");
  });

  it("does not classify unavailable checks as positive signs", () => {
    const split = splitSignalsForDisplay([
      { type: "positive", title: "Valid TLS certificate detected", description: "Valid TLS certificate detected" },
      { type: "positive", title: "Google Safe Browsing not configured", description: "not configured" }
    ] as unknown as TrustSignal[]);
    expect(split.positives).toHaveLength(1);
    expect(split.unavailable).toHaveLength(1);
  });

  it("builds user-friendly summary text", () => {
    const summary = buildConsumerSummary({
      reasons: ["No OpenPhish feed match", "Valid TLS certificate detected"],
      scoreResult: { userExplanation: { mainReasons: ["Google Safe Browsing not configured"], recommendation: "Use caution" } }
    } as unknown as ScamCheckResult);
    expect(summary.why[0]).toContain("unavailable");
    expect(summary.recommendation.length).toBeGreaterThan(0);
  });
});
