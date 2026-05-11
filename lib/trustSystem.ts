export type TrustLevel = "trusted" | "likelyLegit" | "limitedEvidence" | "suspicious" | "highRisk";
export type ScamVerdict = "safe" | "suspicious" | "scam";

/** User-facing trust band label (three bands on 0–100 trust, higher = safer). */
export type TrustBandLabel = "Looks safe / Trusted" | "Be careful / Caution" | "High risk";

export type TrustPresentation = {
  level: TrustLevel;
  label: TrustBandLabel;
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

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function trustScoreFromRisk(riskScore: number): number {
  return clampScore(100 - riskScore);
}

/**
 * Trust-style projection (0–100 trust, higher = safer) — three user-facing bands:
 * 80–100 → trusted, 50–79 → suspicious (caution), 0–49 → highRisk.
 * Legacy `likelyLegit` / `limitedEvidence` are kept in the type for old payloads but are no longer emitted here.
 */
export function trustLevelFromScore(trustScore: number): TrustLevel {
  const t = clampScore(trustScore);
  if (t >= 80) return "trusted";
  if (t >= 50) return "suspicious";
  return "highRisk";
}

export function trustPresentationFromScore(score: number): TrustPresentation {
  const trustScore = clampScore(score);
  const level = trustLevelFromScore(trustScore);

  if (level === "trusted") {
    return {
      level,
      label: "Looks safe / Trusted",
      icon: "check",
      toneText: "text-emerald-800",
      toneSoftBg: "bg-emerald-50/90",
      toneSoftBorder: "border-emerald-200/80",
      progressBar: "bg-emerald-500"
    };
  }

  if (level === "suspicious") {
    return {
      level,
      label: "Be careful / Caution",
      icon: "alert",
      toneText: "text-amber-900",
      toneSoftBg: "bg-amber-50/90",
      toneSoftBorder: "border-amber-300/80",
      progressBar: "bg-amber-500"
    };
  }

  return {
    level,
    label: "High risk",
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
