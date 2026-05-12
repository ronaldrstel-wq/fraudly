import { clampScore } from "@/lib/clampScore";
import { getTrustLabel } from "@/lib/trustScoreUi";

export type TrustLevel = "trusted" | "mostlySafe" | "caution" | "risky" | "highRisk";
export type ScamVerdict = "safe" | "suspicious" | "scam";

export type TrustPresentation = {
  level: TrustLevel;
  /** Same string as {@link getTrustLabel} for this score (website-wide). */
  label: string;
  icon: "check" | "info" | "alert" | "risk";
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

export function trustScoreFromRisk(riskScore: number): number {
  return clampScore(100 - riskScore);
}

/**
 * Trust-style projection (0–100 trust, higher = safer) — five website-facing bands aligned with the iOS app:
 * 80–100 trusted, 65–79 mostly safe, 50–64 caution, 30–49 risky, 0–29 high risk.
 */
export function trustLevelFromScore(trustScore: number): TrustLevel {
  const t = clampScore(trustScore);
  if (t >= 80) return "trusted";
  if (t >= 65) return "mostlySafe";
  if (t >= 50) return "caution";
  if (t >= 30) return "risky";
  return "highRisk";
}

export function trustPresentationFromScore(score: number): TrustPresentation {
  const trustScore = clampScore(score);
  const level = trustLevelFromScore(trustScore);
  const label = getTrustLabel(trustScore);

  if (level === "trusted") {
    return {
      level,
      label,
      icon: "check",
      toneText: "text-emerald-800",
      toneSoftBg: "bg-emerald-50/90",
      toneSoftBorder: "border-emerald-200/80",
      progressBar: "bg-emerald-500"
    };
  }

  if (level === "mostlySafe") {
    return {
      level,
      label,
      icon: "check",
      toneText: "text-teal-900",
      toneSoftBg: "bg-teal-50/90",
      toneSoftBorder: "border-teal-200/80",
      progressBar: "bg-teal-500"
    };
  }

  if (level === "caution") {
    return {
      level,
      label,
      icon: "alert",
      toneText: "text-amber-900",
      toneSoftBg: "bg-amber-50/90",
      toneSoftBorder: "border-amber-300/80",
      progressBar: "bg-amber-500"
    };
  }

  if (level === "risky") {
    return {
      level,
      label,
      icon: "alert",
      toneText: "text-orange-950",
      toneSoftBg: "bg-orange-50/90",
      toneSoftBorder: "border-orange-300/80",
      progressBar: "bg-orange-500"
    };
  }

  return {
    level,
    label,
    icon: "risk",
    toneText: "text-rose-900",
    toneSoftBg: "bg-rose-50/90",
    toneSoftBorder: "border-rose-300/80",
    progressBar: "bg-rose-600"
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
