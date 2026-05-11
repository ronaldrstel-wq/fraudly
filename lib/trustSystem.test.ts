import { describe, expect, it } from "vitest";
import {
  trustLevelFromScore,
  trustPresentationFromScore,
  trustScoreFromRisk,
  verdictFromAssessment,
  verdictFromTrustScore
} from "@/lib/trustSystem";

const looksSafeTrusted = "Looks safe / Trusted";
const beCarefulCaution = "Be careful / Caution";
const highRiskLabel = "High risk";

describe("trust bands", () => {
  it("maps three trust levels by score (80 / 50 thresholds)", () => {
    expect(trustLevelFromScore(100)).toBe("trusted");
    expect(trustLevelFromScore(80)).toBe("trusted");
    expect(trustLevelFromScore(79)).toBe("suspicious");
    expect(trustLevelFromScore(50)).toBe("suspicious");
    expect(trustLevelFromScore(49)).toBe("highRisk");
    expect(trustLevelFromScore(0)).toBe("highRisk");
  });

  it("labels presentation for user-facing trust bands", () => {
    expect(trustPresentationFromScore(100).label).toBe(looksSafeTrusted);
    expect(trustPresentationFromScore(80).label).toBe(looksSafeTrusted);
    expect(trustPresentationFromScore(79).label).toBe(beCarefulCaution);
    expect(trustPresentationFromScore(50).label).toBe(beCarefulCaution);
    expect(trustPresentationFromScore(49).label).toBe(highRiskLabel);
    expect(trustPresentationFromScore(0).label).toBe(highRiskLabel);
  });

  it("inverts risk to trust linearly", () => {
    expect(trustScoreFromRisk(0)).toBe(100);
    expect(trustScoreFromRisk(40)).toBe(60);
    expect(trustScoreFromRisk(100)).toBe(0);
  });
});

describe("verdictFromAssessment", () => {
  it("flags scam on confirmed malicious regardless of score", () => {
    expect(verdictFromAssessment({ riskScore: 20, confirmedMalicious: true })).toBe("scam");
  });

  it("flags scam on strong deception with modest trust", () => {
    expect(verdictFromAssessment({ riskScore: 50, confirmedMalicious: false, lexicalStrong: true })).toBe("scam");
  });

  it("does not return scam for low-data modest risk without deception or feeds", () => {
    expect(verdictFromAssessment({ riskScore: 55, confirmedMalicious: false, lexicalStrong: false })).toBe("suspicious");
    expect(verdictFromAssessment({ riskScore: 45, confirmedMalicious: false, lexicalStrong: false })).toBe("suspicious");
    expect(verdictFromAssessment({ riskScore: 35, confirmedMalicious: false, lexicalStrong: false })).toBe("safe");
  });

  it("returns scam only for extreme numeric risk when no other flags", () => {
    expect(verdictFromAssessment({ riskScore: 85, confirmedMalicious: false })).toBe("scam");
  });
});

describe("verdictFromTrustScore", () => {
  it("passes optional flags through to assessment", () => {
    expect(verdictFromTrustScore(30, { lexicalStrong: true })).toBe("scam");
    expect(verdictFromTrustScore(30, { lexicalStrong: false })).toBe("suspicious");
  });
});
