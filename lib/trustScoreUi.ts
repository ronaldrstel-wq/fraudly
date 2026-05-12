import { clampScore } from "@/lib/clampScore";

/** Canonical website trust tiers (higher score = safer). Aligns with iOS interpretation. */
export type TrustUiTier = "safe" | "mostlySafe" | "caution" | "risky" | "highRisk";

export function trustUiTierFromScore(score: number): TrustUiTier {
  const t = clampScore(score);
  if (t >= 80) return "safe";
  if (t >= 65) return "mostlySafe";
  if (t >= 50) return "caution";
  if (t >= 30) return "risky";
  return "highRisk";
}

/** Primary consumer-facing label for a trust score (0–100). */
export function getTrustLabel(score: number): string {
  switch (trustUiTierFromScore(score)) {
    case "safe":
      return "Looks safe";
    case "mostlySafe":
      return "Looks mostly safe";
    case "caution":
      return "Be careful";
    case "risky":
      return "Risky";
    case "highRisk":
    default:
      return "High risk";
  }
}

/** Short narrative under the headline / technical band (deterministic, website-wide). */
export function getTrustDescription(score: number): string {
  switch (trustUiTierFromScore(score)) {
    case "safe":
      return "This website shows multiple positive trust indicators and no major scam signals were detected in this scan.";
    case "mostlySafe":
      return "No major scam signals were detected in this scan, although some checks were limited or worth reviewing.";
    case "caution":
      return "Some risk indicators were detected. Proceed carefully before entering personal or payment information.";
    case "risky":
      return "Several concerning signals appeared in this scan. Avoid sharing personal or payment details until you can verify the site independently.";
    case "highRisk":
    default:
      return "Several strong risk signals were detected in this scan.";
  }
}

/** Same tiers as {@link trustUiTierFromScore}; alias for call sites that prefer “tone” naming. */
export function getTrustTone(score: number): TrustUiTier {
  return trustUiTierFromScore(score);
}
