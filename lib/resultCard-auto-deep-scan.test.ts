import { describe, expect, it } from "vitest";
import { shouldAutoTriggerDeepScan } from "@/components/ResultCard";
import type { ScamCheckResult } from "@/types/scam";

describe("ResultCard deep-scan auto trigger", () => {
  it("auto-triggers for suspicious ecommerce profiles", () => {
    const shouldTrigger = shouldAutoTriggerDeepScan({
      score: 42,
      trustSignals: [{ type: "danger", title: "Risk", description: "High risk", confidence: "high" }],
      supplyChainSignals: { likelyDropshipping: true, likelyChinaShipping: false, likelyLocalProduction: false },
      scoreResult: { riskLabels: ["Possible dropshipping store"] }
    } as unknown as ScamCheckResult);
    expect(shouldTrigger).toBe(true);
  });

  it("does not auto-trigger for low-risk profile", () => {
    const shouldTrigger = shouldAutoTriggerDeepScan({
      score: 12,
      trustSignals: [{ type: "positive", title: "Positive", description: "Looks normal", confidence: "medium" }],
      supplyChainSignals: { likelyDropshipping: false, likelyChinaShipping: false, likelyLocalProduction: true },
      scoreResult: { riskLabels: [] }
    } as unknown as ScamCheckResult);
    expect(shouldTrigger).toBe(false);
  });
});
