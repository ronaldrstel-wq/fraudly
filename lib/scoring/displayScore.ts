import { clampScore } from "@/lib/clampScore";
import { verdictFromPublicSnapshotLabel } from "@/lib/latest-public-checks/status-label";
import type { ScamVerdict } from "@/types/scam";

/** Consumer-facing band (aligned with Fraudly public copy). */
export type ConsumerDisplayBand = "trusted" | "caution" | "highRisk";

export type PublicDisplayScore = {
  /** Stored / computed risk (0–100, higher = riskier). */
  riskScore: number;
  /** Display trust (0–100, higher = safer). Always `100 - riskScore` after normalization. */
  trustScore: number;
  band: ConsumerDisplayBand;
  /** Trusted | Caution | High Risk */
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

export function consumerDisplayBand(trustScore: number): ConsumerDisplayBand {
  const t = clampScore(trustScore);
  if (t >= 80) return "trusted";
  if (t >= 50) return "caution";
  return "highRisk";
}

/** Short band label (internal / secondary). */
export function consumerDisplayLabel(trustScore: number): string {
  switch (consumerDisplayBand(trustScore)) {
    case "trusted":
      return "Trusted";
    case "caution":
      return "Caution";
    case "highRisk":
    default:
      return "High Risk";
  }
}

/** Primary consumer verdict shown on results and latest-check cards. */
export function standardVerdictLabel(trustScore: number): string {
  switch (consumerDisplayBand(trustScore)) {
    case "trusted":
      return "Likely Safe";
    case "caution":
      return "Use Caution";
    case "highRisk":
    default:
      return "High Scam Risk";
  }
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
    source: ctx.source
  });
}
