import { describe, expect, it } from "vitest";
import {
  consumerDisplayLabel,
  normalizeRiskScore,
  publicDisplayScoreFromRiskAndVerdict,
  riskScoreFromTrust,
  standardVerdictLabel,
  trustScoreFromRisk
} from "@/lib/scoring/displayScore";

describe("displayScore", () => {
  it("maps risk 10 → trust 90 → Likely Safe", () => {
    const d = publicDisplayScoreFromRiskAndVerdict(10, "safe");
    expect(d.trustScore).toBe(90);
    expect(d.label).toBe("Likely Safe");
    expect(d.riskScore).toBe(10);
  });

  it("maps risk 35 → trust 65 → Use Caution", () => {
    const d = publicDisplayScoreFromRiskAndVerdict(35, "suspicious");
    expect(d.trustScore).toBe(65);
    expect(d.label).toBe("Use Caution");
  });

  it("maps risk 75 → trust 25 → High Risk", () => {
    const d = publicDisplayScoreFromRiskAndVerdict(75, "scam");
    expect(d.trustScore).toBe(25);
    expect(d.label).toBe("High Risk");
  });

  it("does not treat trust 90 as risk (no accidental inversion)", () => {
    expect(trustScoreFromRisk(10)).toBe(90);
    expect(trustScoreFromRisk(90)).toBe(10);
    expect(normalizeRiskScore(90)).toBe(90);
    expect(riskScoreFromTrust(90)).toBe(10);
    expect(trustScoreFromRisk(90)).not.toBe(90);
  });

  it("clamps out-of-range risk", () => {
    expect(trustScoreFromRisk(150)).toBe(0);
    expect(trustScoreFromRisk(-5)).toBe(100);
  });

  it("derives consumer labels from trust bands only", () => {
    expect(consumerDisplayLabel(85)).toBe("Trusted");
    expect(consumerDisplayLabel(75)).toBe("Trusted");
    expect(consumerDisplayLabel(60)).toBe("Caution");
    expect(consumerDisplayLabel(40)).toBe("Caution");
    expect(consumerDisplayLabel(20)).toBe("High Risk");
  });

  it("maps standard verdict labels for consumer surfaces", () => {
    expect(standardVerdictLabel(90)).toBe("Likely Safe");
    expect(standardVerdictLabel(75)).toBe("Mostly Safe");
    expect(standardVerdictLabel(60)).toBe("Use Caution");
    expect(standardVerdictLabel(40)).toBe("Suspicious");
    expect(standardVerdictLabel(24)).toBe("High Risk");
  });
});
