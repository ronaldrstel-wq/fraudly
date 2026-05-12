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
    expect(trustLevelFromScore(80)).toBe("trusted");
    expect(trustLevelFromScore(79)).toBe("mostlySafe");
    expect(trustLevelFromScore(65)).toBe("mostlySafe");
    expect(trustLevelFromScore(64)).toBe("caution");
    expect(trustLevelFromScore(50)).toBe("caution");
    expect(trustLevelFromScore(49)).toBe("risky");
    expect(trustLevelFromScore(30)).toBe("risky");
    expect(trustLevelFromScore(29)).toBe("highRisk");
    expect(trustLevelFromScore(0)).toBe("highRisk");
  });

  it("labels presentation for user-facing trust bands", () => {
    expect(trustPresentationFromScore(92).label).toBe("Looks safe");
    expect(trustPresentationFromScore(80).label).toBe("Looks safe");
    expect(trustPresentationFromScore(73).label).toBe("Looks mostly safe");
    expect(trustPresentationFromScore(58).label).toBe("Be careful");
    expect(trustPresentationFromScore(41).label).toBe("Risky");
    expect(trustPresentationFromScore(18).label).toBe("High risk");
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
