import { clampScore, trustPresentationFromScore, trustScoreFromRisk } from "@/lib/trustSystem";

export function trustDisplayFromTrustScore(score: number) {
  const trustScore = clampScore(score);
  const presentation = trustPresentationFromScore(trustScore);
  return { trustScore, ...presentation };
}

export function trustDisplayFromRiskScore(riskScore: number) {
  return trustDisplayFromTrustScore(trustScoreFromRisk(riskScore));
}

