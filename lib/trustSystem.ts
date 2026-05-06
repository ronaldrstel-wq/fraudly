export type TrustLevel = "trusted" | "caution" | "highRisk";
export type ScamVerdict = "safe" | "suspicious" | "scam";

export type TrustPresentation = {
  level: TrustLevel;
  label: "Trusted" | "Caution" | "High Risk";
  icon: "check" | "alert" | "risk";
  toneText: string;
  toneSoftBg: string;
  toneSoftBorder: string;
  progressBar: string;
};

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function trustScoreFromRisk(riskScore: number): number {
  return clampScore(100 - riskScore);
}

export function trustLevelFromScore(trustScore: number): TrustLevel {
  if (trustScore >= 80) return "trusted";
  if (trustScore >= 50) return "caution";
  return "highRisk";
}

export function verdictFromTrustScore(trustScore: number): ScamVerdict {
  const level = trustLevelFromScore(trustScore);
  if (level === "trusted") return "safe";
  if (level === "caution") return "suspicious";
  return "scam";
}

export function verdictFromRiskScore(riskScore: number): ScamVerdict {
  return verdictFromTrustScore(trustScoreFromRisk(riskScore));
}

export function trustPresentationFromScore(score: number): TrustPresentation {
  const trustScore = clampScore(score);
  const level = trustLevelFromScore(trustScore);

  if (level === "trusted") {
    return {
      level,
      label: "Trusted",
      icon: "check",
      toneText: "text-emerald-700",
      toneSoftBg: "bg-emerald-50",
      toneSoftBorder: "border-emerald-200",
      progressBar: "bg-emerald-500"
    };
  }

  if (level === "caution") {
    return {
      level,
      label: "Caution",
      icon: "alert",
      toneText: "text-amber-700",
      toneSoftBg: "bg-amber-50",
      toneSoftBorder: "border-amber-200",
      progressBar: "bg-amber-500"
    };
  }

  return {
    level,
    label: "High Risk",
    icon: "risk",
    toneText: "text-rose-700",
    toneSoftBg: "bg-rose-50",
    toneSoftBorder: "border-rose-200",
    progressBar: "bg-rose-500"
  };
}

export function trustIconGlyph(icon: TrustPresentation["icon"]): string {
  if (icon === "check") return "✓";
  if (icon === "alert") return "!";
  return "✕";
}

