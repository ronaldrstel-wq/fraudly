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

    expect(trustScore).toBeGreaterThanOrEqual(80);
    expect(trustScore).toBeLessThanOrEqual(100);
    expect(trustLevel).toBe("trusted");
    expect(result.verdict).toBe("safe");
  });
});

