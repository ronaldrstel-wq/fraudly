import { describe, expect, it } from "vitest";
import {
  trustLevelFromScore,
  trustPresentationFromScore,
  trustScoreFromRisk,
  verdictFromAssessment,
  verdictFromTrustScore
} from "@/lib/trustSystem";

describe("trust bands", () => {
  it("maps five trust levels by score thresholds", () => {
    expect(trustLevelFromScore(100)).toBe("trusted");
    expect(trustLevelFromScore(85)).toBe("trusted");
    expect(trustLevelFromScore(84)).toBe("mostlySafe");
    expect(trustLevelFromScore(70)).toBe("mostlySafe");
    expect(trustLevelFromScore(69)).toBe("caution");
    expect(trustLevelFromScore(50)).toBe("caution");
    expect(trustLevelFromScore(49)).toBe("risky");
    expect(trustLevelFromScore(30)).toBe("risky");
    expect(trustLevelFromScore(29)).toBe("highRisk");
    expect(trustLevelFromScore(0)).toBe("highRisk");
  });

  it("labels presentation for user-facing trust bands", () => {
    expect(trustPresentationFromScore(92).label).toBe("Likely Safe");
    expect(trustPresentationFromScore(85).label).toBe("Likely Safe");
    expect(trustPresentationFromScore(75).label).toBe("Mostly Safe");
    expect(trustPresentationFromScore(60).label).toBe("Use Caution");
    expect(trustPresentationFromScore(40).label).toBe("Suspicious");
    expect(trustPresentationFromScore(18).label).toBe("High Risk");
  });

  it("uses non-green tone for mostly-safe scores", () => {
    expect(trustPresentationFromScore(75).tone).toBe("mostly-safe");
    expect(trustPresentationFromScore(75).progressBar).toContain("teal");
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
