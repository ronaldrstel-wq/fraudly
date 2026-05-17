import { clampScore } from "@/lib/clampScore";
import {
  getTrustBandFromScore,
  getTrustPresentation,
  type SemanticTone,
  type TrustBandId
} from "@/lib/scoring/trust-bands";

export type TrustLevel = "trusted" | "mostlySafe" | "caution" | "risky" | "highRisk";
export type ScamVerdict = "safe" | "suspicious" | "scam";

export type TrustPresentation = {
  level: TrustLevel;
  /** Consumer-facing headline (matches canonical verdict band). */
  label: string;
  icon: "check" | "info" | "alert" | "risk";
  tone: SemanticTone;
  toneText: string;
  toneSoftBg: string;
  toneSoftBorder: string;
  progressBar: string;
};

export type VerdictAssessmentInput = {
  riskScore: number;
  /** Tier‑1 feed / police matches (not “unknown” provider states). */
  confirmedMalicious: boolean;
  /** Strong hostname spoofing / disposable composition — allows scam verdict without only relying on missing data. */
  lexicalStrong?: boolean;
};

export { clampScore } from "@/lib/clampScore";
export {
  getTrustPresentation,
  getTrustBandFromScore,
  standardVerdictLabel,
  trustMeterColors
} from "@/lib/scoring/trust-bands";

import { trustScoreFromRisk } from "@/lib/scoring/displayScore";
export { trustScoreFromRisk };

function trustLevelFromBand(band: TrustBandId): TrustLevel {
  switch (band) {
    case "likely-safe":
      return "trusted";
    case "mostly-safe":
      return "mostlySafe";
    case "caution":
      return "caution";
    case "suspicious":
      return "risky";
    case "high-risk":
    default:
      return "highRisk";
  }
}

/** Trust-style projection (0–100 trust, higher = safer) — five website-facing bands. */
export function trustLevelFromScore(trustScore: number): TrustLevel {
  return trustLevelFromBand(getTrustBandFromScore(trustScore));
}

function iconForTone(tone: SemanticTone): TrustPresentation["icon"] {
  if (tone === "safe") return "check";
  if (tone === "mostly-safe") return "info";
  if (tone === "caution" || tone === "suspicious") return "alert";
  return "risk";
}

export function trustPresentationFromScore(score: number): TrustPresentation {
  const trustScore = clampScore(score);
  const presentation = getTrustPresentation(trustScore);
  const level = trustLevelFromBand(presentation.band);

  return {
    level,
    label: presentation.headline,
    icon: iconForTone(presentation.tone),
    tone: presentation.tone,
    toneText: presentation.colors.toneText,
    toneSoftBg: presentation.colors.softBg,
    toneSoftBorder: presentation.colors.softBorder,
    progressBar: presentation.colors.progressBar
  };
}

/**
 * Maps trust projection to legacy API verdicts.
 * Low confidence / missing intel alone must not yield `scam` unless risk is extreme or deception is strong.
 */
export function verdictFromTrustScore(
  trustScore: number,
  opts?: { confirmedMalicious?: boolean; lexicalStrong?: boolean }
): ScamVerdict {
  return verdictFromAssessment({
    riskScore: 100 - clampScore(trustScore),
    confirmedMalicious: opts?.confirmedMalicious ?? false,
    lexicalStrong: opts?.lexicalStrong
  });
}

export function verdictFromAssessment(input: VerdictAssessmentInput): ScamVerdict {
  const trust = trustScoreFromRisk(input.riskScore);
  if (input.confirmedMalicious) return "scam";
  if (input.lexicalStrong && trust < 55) return "scam";
  if (trust < 20) return "scam";
  if (trust < 60) return "suspicious";
  return "safe";
}

export function trustIconGlyph(icon: TrustPresentation["icon"]): string {
  if (icon === "check") return "✓";
  if (icon === "info") return "i";
  if (icon === "alert") return "!";
  return "✕";
}
