import { describe, expect, it } from "vitest";
import {
  trustLevelFromScore,
  trustPresentationFromScore,
  trustScoreFromRisk
} from "@/lib/trustSystem";
import { trustDisplayFromRiskScore, trustDisplayFromTrustScore } from "@/lib/trustDisplay";

describe("global trust thresholds", () => {
  it("maps 85-100 to Trusted", () => {
    expect(trustLevelFromScore(85)).toBe("trusted");
    expect(trustLevelFromScore(95)).toBe("trusted");
    expect(trustPresentationFromScore(100).label).toBe("Trusted");
  });

  it("maps 45-84 to Caution", () => {
    expect(trustLevelFromScore(45)).toBe("caution");
    expect(trustLevelFromScore(84)).toBe("caution");
    expect(trustPresentationFromScore(70).label).toBe("Likely Safe");
    expect(trustPresentationFromScore(55).label).toBe("Mixed / Unknown");
  });

  it("maps 0-44 to High Risk", () => {
    expect(trustLevelFromScore(0)).toBe("highRisk");
    expect(trustLevelFromScore(44)).toBe("highRisk");
    expect(trustPresentationFromScore(35).label).toBe("Suspicious");
    expect(trustPresentationFromScore(10).label).toBe("Dangerous");
  });

  it("never uses green tones for risky bands", () => {
    const risky = trustPresentationFromScore(45);
    const highRisk = trustPresentationFromScore(25);
    const dangerous = trustPresentationFromScore(10);
    expect(risky.toneText.includes("emerald")).toBe(false);
    expect(highRisk.toneText.includes("emerald")).toBe(false);
    expect(dangerous.toneText.includes("emerald")).toBe(false);
  });
});

describe("display band consistency", () => {
  it("maps representative scores to expected labels", () => {
    expect(trustPresentationFromScore(88).label).toBe("Trusted");
    expect(trustPresentationFromScore(68).label).toBe("Likely Safe");
    expect(trustPresentationFromScore(50).label).toBe("Mixed / Unknown");
    expect(trustPresentationFromScore(40).label).toBe("Suspicious");
    expect(trustPresentationFromScore(20).label).toBe("Dangerous");
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

