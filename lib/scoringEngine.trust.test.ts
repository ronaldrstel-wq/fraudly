import { describe, expect, it } from "vitest";
import { calculateScamScore } from "@/lib/scoringEngine";
import { trustLevelFromScore, trustScoreFromRisk } from "@/lib/trustSystem";

describe("scoring engine trust outcomes", () => {
  it("classifies apple.com as Trusted when no major risk signals are present", () => {
    const result = calculateScamScore({
      domain: "apple.com",
      heuristicReasons: []
    });

    const trustScore = trustScoreFromRisk(result.finalScore);
    const trustLevel = trustLevelFromScore(trustScore);

    expect(trustScore).toBeGreaterThanOrEqual(90);
    expect(trustScore).toBeLessThanOrEqual(100);
    expect(trustLevel).toBe("trusted");
    expect(result.verdict).toBe("safe");
  });

  it("classifies paypal.com as Trusted when no major risk signals are present", () => {
    const result = calculateScamScore({
      domain: "paypal.com",
      heuristicReasons: []
    });

    const trustScore = trustScoreFromRisk(result.finalScore);
    const trustLevel = trustLevelFromScore(trustScore);

    expect(trustScore).toBeGreaterThanOrEqual(85);
    expect(trustLevel).toBe("trusted");
    expect(result.verdict).toBe("safe");
  });
});

