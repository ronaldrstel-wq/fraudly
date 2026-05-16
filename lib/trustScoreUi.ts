import { clampScore } from "@/lib/clampScore";
import { getTrustBandFromScore, getTrustPresentation, type SemanticTone } from "@/lib/scoring/trust-bands";

/** @deprecated Prefer {@link SemanticTone} from trust-bands. */
export type TrustUiTier = "safe" | "mostlySafe" | "caution" | "risky" | "highRisk";

export function trustUiTierFromScore(score: number): TrustUiTier {
  const band = getTrustBandFromScore(score);
  if (band === "likely-safe") return "safe";
  if (band === "mostly-safe") return "mostlySafe";
  if (band === "caution") return "caution";
  if (band === "suspicious") return "risky";
  return "highRisk";
}

/** Primary consumer-facing label for a trust score (0–100). */
export function getTrustLabel(score: number): string {
  return getTrustPresentation(score).headline;
}

/** Short narrative under the headline / technical band (deterministic, website-wide). */
export function getTrustDescription(score: number): string {
  return getTrustPresentation(score).description;
}

/** Same tiers as {@link trustUiTierFromScore}; alias for call sites that prefer “tone” naming. */
export function getTrustTone(score: number): TrustUiTier {
  return trustUiTierFromScore(score);
}

export function semanticToneFromScore(score: number): SemanticTone {
  return getTrustPresentation(score).tone;
}
