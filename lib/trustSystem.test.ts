import { describe, expect, it } from "vitest";
import {
  trustLevelFromScore,
  trustPresentationFromScore,
  trustScoreFromRisk,
  verdictFromAssessment,
  verdictFromTrustScore
} from "@/lib/trustSystem";

describe("trust bands", () => {
  it("maps five trust levels by score (90 / 70 / 40 / 20 thresholds)", () => {
    expect(trustLevelFromScore(95)).toBe("trusted");
    expect(trustLevelFromScore(90)).toBe("trusted");
    expect(trustLevelFromScore(89)).toBe("likelyLegit");
    expect(trustLevelFromScore(70)).toBe("likelyLegit");
    expect(trustLevelFromScore(69)).toBe("limitedEvidence");
    expect(trustLevelFromScore(50)).toBe("limitedEvidence");
    expect(trustLevelFromScore(40)).toBe("limitedEvidence");
    expect(trustLevelFromScore(39)).toBe("suspicious");
    expect(trustLevelFromScore(20)).toBe("suspicious");
    expect(trustLevelFromScore(19)).toBe("highRisk");
    expect(trustLevelFromScore(0)).toBe("highRisk");
  });

  it("labels presentation for each band", () => {
    expect(trustPresentationFromScore(92).label).toBe("Trusted");
    expect(trustPresentationFromScore(75).label).toBe("Likely Legit");
    expect(trustPresentationFromScore(45).label).toBe("Limited Evidence");
    expect(trustPresentationFromScore(25).label).toBe("Suspicious");
    expect(trustPresentationFromScore(5).label).toBe("High Risk");
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
