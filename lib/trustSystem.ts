export type TrustLevel = "trusted" | "likelyLegit" | "limitedEvidence" | "suspicious" | "highRisk";
export type ScamVerdict = "safe" | "suspicious" | "scam";

export type TrustPresentation = {
  level: TrustLevel;
  label: "Trusted" | "Likely Legit" | "Limited Public Data" | "Caution" | "High Risk";
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
 * Trust-style projection bands (0–100, higher is better).
 * Missing third-party data should move the score into “Limited Evidence”, not straight to “High Risk”.
 */
export function trustLevelFromScore(trustScore: number): TrustLevel {
  const t = clampScore(trustScore);
  if (t >= 90) return "trusted";
  if (t >= 70) return "likelyLegit";
  if (t >= 40) return "limitedEvidence";
  if (t >= 20) return "suspicious";
  return "highRisk";
}

export function trustPresentationFromScore(score: number): TrustPresentation {
  const trustScore = clampScore(score);
  const level = trustLevelFromScore(trustScore);

  if (level === "trusted") {
    return {
      level,
      label: "Trusted",
      icon: "check",
      toneText: "text-emerald-800",
      toneSoftBg: "bg-emerald-50/90",
      toneSoftBorder: "border-emerald-200/80",
      progressBar: "bg-emerald-500"
    };
  }

  if (level === "likelyLegit") {
    return {
      level,
      label: "Likely Legit",
      icon: "check",
      toneText: "text-teal-900",
      toneSoftBg: "bg-teal-50/90",
      toneSoftBorder: "border-teal-200/90",
      progressBar: "bg-teal-500"
    };
  }

  if (level === "limitedEvidence") {
    return {
      level,
      label: "Limited Public Data",
      icon: "info",
      toneText: "text-slate-600",
      toneSoftBg: "bg-slate-100/90",
      toneSoftBorder: "border-slate-300/90",
      progressBar: "bg-slate-400"
    };
  }

  if (level === "suspicious") {
    return {
      level,
      label: "Caution",
      icon: "alert",
      toneText: "text-amber-900",
      toneSoftBg: "bg-amber-50/90",
      toneSoftBorder: "border-amber-300/80",
      progressBar: "bg-amber-500"
    };
  }

  return {
    level,
    label: "High Risk",
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
