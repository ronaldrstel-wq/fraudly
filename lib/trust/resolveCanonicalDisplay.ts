import { clampScore } from "@/lib/clampScore";
import { scamVerdictFromConsumerLabel } from "@/lib/scoring/consumerVerdictMap";
import {
  normalizeRiskScore,
  riskScoreFromTrust,
  trustScoreFromRisk
} from "@/lib/scoring/displayScore";
import {
  getTrustBandFromScore,
  standardVerdictLabel,
  type ConsumerVerdictLabel,
  type TrustBandId
} from "@/lib/scoring/trust-bands";
import { displayTrustScoreForResult } from "@/lib/scanPresentation";
import type { CanonicalTrustFields } from "@/lib/trust/canonicalTrustBridge";
import { normalizeTrustResult } from "@/lib/trust/normalizeTrustResult";
import type { ConfidenceLevel } from "@/types/site-outcome";
import type { ScamCheckResult, ScamVerdict } from "@/types/scam";

export type CanonicalColumnInput = {
  riskScoreSnapshot: number;
  normalizedTrustScore?: number | null;
  normalizedRiskScore?: number | null;
  consumerVerdictLabel?: string | null;
  consumerVerdictBand?: string | null;
  consumerVerdict?: ScamVerdict | null;
  scoreConfidence?: ConfidenceLevel | null;
};

const SCORE_PAIR_TOLERANCE = 2;

/**
 * Resolves persisted list/snapshot columns into a consistent risk/trust pair.
 * When trust and risk columns disagree, trust is treated as the display source of truth.
 */
export function resolveCanonicalFromPersistedColumns(
  row: CanonicalColumnInput
): CanonicalTrustFields {
  const snapshotRisk = normalizeRiskScore(row.riskScoreSnapshot);
  const hasTrust =
    row.normalizedTrustScore != null && Number.isFinite(row.normalizedTrustScore);
  const hasRisk = row.normalizedRiskScore != null && Number.isFinite(row.normalizedRiskScore);

  let trustScore: number;
  let riskScore: number;

  if (hasTrust && hasRisk) {
    trustScore = clampScore(row.normalizedTrustScore!);
    riskScore = normalizeRiskScore(row.normalizedRiskScore!);
    if (Math.abs(riskScore - riskScoreFromTrust(trustScore)) > SCORE_PAIR_TOLERANCE) {
      riskScore = normalizeRiskScore(row.normalizedRiskScore!);
      trustScore = trustScoreFromRisk(riskScore);
    }
  } else if (hasTrust) {
    trustScore = clampScore(row.normalizedTrustScore!);
    riskScore = riskScoreFromTrust(trustScore);
    if (Math.abs(snapshotRisk - riskScore) > SCORE_PAIR_TOLERANCE) {
      riskScore = snapshotRisk;
      trustScore = trustScoreFromRisk(riskScore);
    }
  } else if (hasRisk) {
    riskScore = normalizeRiskScore(row.normalizedRiskScore!);
    trustScore = trustScoreFromRisk(riskScore);
  } else {
    riskScore = snapshotRisk;
    trustScore = trustScoreFromRisk(riskScore);
  }

  const consumerVerdictLabel =
    (row.consumerVerdictLabel as ConsumerVerdictLabel | null) ??
    (standardVerdictLabel(trustScore) as ConsumerVerdictLabel);

  return {
    trustScore,
    riskScore,
    consumerVerdict:
      (row.consumerVerdict as ScamVerdict | null) ??
      scamVerdictFromConsumerLabel(consumerVerdictLabel),
    consumerVerdictLabel,
    consumerVerdictBand:
      (row.consumerVerdictBand as TrustBandId | null) ?? getTrustBandFromScore(trustScore),
    scoreConfidence: row.scoreConfidence ?? "medium"
  };
}

/** Single live-analysis canonical path — all writes and API responses must use this. */
export function buildCanonicalTrustFieldsFromResult(result: ScamCheckResult): CanonicalTrustFields {
  const normalized = normalizeTrustResult(result, { route: "buildCanonicalTrustFieldsFromResult" });
  const riskScore = normalizeRiskScore(result.score);
  const trustScore = displayTrustScoreForResult(result) ?? normalized.trustScore ?? trustScoreFromRisk(riskScore);
  const consumerVerdictLabel = standardVerdictLabel(trustScore) as ConsumerVerdictLabel;

  return {
    trustScore: clampScore(trustScore),
    riskScore,
    consumerVerdict: scamVerdictFromConsumerLabel(consumerVerdictLabel),
    consumerVerdictLabel,
    consumerVerdictBand: getTrustBandFromScore(trustScore),
    scoreConfidence: result.confidenceLevel ?? "medium"
  };
}
