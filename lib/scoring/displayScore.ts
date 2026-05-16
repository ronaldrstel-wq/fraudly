import { clampScore } from "@/lib/clampScore";
import { verdictFromPublicSnapshotLabel } from "@/lib/latest-public-checks/status-label";
import type { ScamVerdict } from "@/types/scam";
import {
  consumerDisplayBand,
  consumerDisplayLabel,
  getTrustPresentation,
  standardVerdictLabel,
  type ConsumerDisplayBand
} from "@/lib/scoring/trust-bands";

export type { ConsumerDisplayBand } from "@/lib/scoring/trust-bands";
export { consumerDisplayBand, consumerDisplayLabel, standardVerdictLabel } from "@/lib/scoring/trust-bands";

export type PublicDisplayScore = {
  /** Stored / computed risk (0–100, higher = riskier). */
  riskScore: number;
  /** Display trust (0–100, higher = safer). Always `100 - riskScore` after normalization. */
  trustScore: number;
  band: ConsumerDisplayBand;
  /** Consumer verdict label */
  label: string;
  verdict: ScamVerdict | null;
};

export function normalizeRiskScore(risk: number): number {
  const n = Number.isFinite(risk) ? Math.round(risk) : 0;
  return clampScore(n);
}

/** Single conversion: risk → trust. Input must be risk, not trust. */
export function trustScoreFromRisk(risk: number): number {
  return clampScore(100 - normalizeRiskScore(risk));
}

export function riskScoreFromTrust(trust: number): number {
  return clampScore(100 - clampScore(trust));
}

export function publicDisplayScoreFromRiskAndVerdict(
  riskScoreSnapshot: number,
  verdict: ScamVerdict | null
): PublicDisplayScore {
  const riskScore = normalizeRiskScore(riskScoreSnapshot);
  const trustScore = trustScoreFromRisk(riskScore);
  return {
    riskScore,
    trustScore,
    band: consumerDisplayBand(trustScore),
    label: standardVerdictLabel(trustScore),
    verdict
  };
}

export function publicDisplayScoreFromLatestRow(row: {
  id: string;
  riskScoreSnapshot: number;
  statusLabel: string;
}): PublicDisplayScore & { scanId: string } {
  const verdict = verdictFromPublicSnapshotLabel(row.statusLabel);
  const score = publicDisplayScoreFromRiskAndVerdict(row.riskScoreSnapshot, verdict);
  return { ...score, scanId: row.id };
}

export type DisplayScoreDebugContext = {
  domain: string;
  scanId?: string | null;
  storedRiskScore: number;
  storedTrustScore?: number | null;
  displayedTrustScore: number | null;
  displayedLabel: string;
  source: string;
};

/** Development-only trace for list vs detail alignment. */
export function logDisplayScoreDebug(ctx: DisplayScoreDebugContext): void {
  if (process.env.NODE_ENV !== "development") return;
  console.debug("[displayScore]", {
    domain: ctx.domain,
    scanId: ctx.scanId ?? null,
    storedRiskScore: ctx.storedRiskScore,
    storedTrustScore: ctx.storedTrustScore ?? null,
    displayedTrustScore: ctx.displayedTrustScore,
    displayedLabel: ctx.displayedLabel,
    source: ctx.source,
    band: ctx.displayedTrustScore != null ? getTrustPresentation(ctx.displayedTrustScore).band : null
  });
}
