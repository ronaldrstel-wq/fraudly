import { describe, expect, it } from "vitest";
import {
  trustLevelFromScore,
  trustPresentationFromScore,
  trustScoreFromRisk
} from "@/lib/trustSystem";
import { trustDisplayFromRiskScore, trustDisplayFromTrustScore } from "@/lib/trustDisplay";

describe("global trust thresholds", () => {
  it("maps 80-100 to Trusted", () => {
    expect(trustLevelFromScore(80)).toBe("trusted");
    expect(trustLevelFromScore(95)).toBe("trusted");
    expect(trustPresentationFromScore(100).label).toBe("Trusted");
  });

  it("maps 50-79 to Caution", () => {
    expect(trustLevelFromScore(50)).toBe("caution");
    expect(trustLevelFromScore(79)).toBe("caution");
    expect(trustPresentationFromScore(60).label).toBe("Caution");
  });

  it("maps 0-49 to High Risk", () => {
    expect(trustLevelFromScore(0)).toBe("highRisk");
    expect(trustLevelFromScore(49)).toBe("highRisk");
    expect(trustPresentationFromScore(20).label).toBe("High Risk");
  });
});

describe("risk to trust conversion", () => {
  it("converts trust = 100 - risk (clamped)", () => {
    expect(trustScoreFromRisk(0)).toBe(100);
    expect(trustScoreFromRisk(20)).toBe(80);
    expect(trustScoreFromRisk(50)).toBe(50);
    expect(trustScoreFromRisk(100)).toBe(0);
  });
});

describe("latest and recent trust display consistency", () => {
  it("uses the same trust helper output for equivalent values", () => {
    const latest = trustDisplayFromRiskScore(20); // trust 80
    const recent = trustDisplayFromTrustScore(80);

    expect(latest.label).toBe(recent.label);
    expect(latest.icon).toBe(recent.icon);
    expect(latest.toneText).toBe(recent.toneText);
    expect(latest.progressBar).toBe(recent.progressBar);
  });
});

