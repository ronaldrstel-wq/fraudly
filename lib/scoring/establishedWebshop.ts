import type { DomainPatternAnalysis } from "@/lib/domainPatternHeuristics";
import type { ScoringIdentityContext } from "@/lib/scoringIdentityContext";
import type { IntelSurfaceInput, ScoreSignal } from "@/lib/scoringEngine";

export type EstablishedWebshopTier = "none" | "strong" | "very_strong";

export type EstablishedWebshopLegitimacy = {
  eligible: boolean;
  tier: EstablishedWebshopTier;
  ageDays: number | null;
};

/** Consumer copy for review-driven cautions — shopping experience, not fraud. */
export const CUSTOMER_EXPERIENCE_REVIEW_NOTE =
  "Mixed customer experiences reported. Check reviews, delivery times and return policy before ordering.";

const TWO_YEARS_DAYS = 730;
const FIVE_YEARS_DAYS = 1825;

export function hasThreatFeedScamHit(signals: ScoreSignal[] | undefined): boolean {
  if (!signals?.length) return false;
  return signals.some((s) => s.evidenceTier === "confirmed_malicious" && s.impact > 0);
}

/**
 * Legitimacy anchor for long-running ecommerce domains with clean threat intel.
 * Does not apply when feeds, impersonation cues, or invalid HTTPS are present.
 */
export function assessEstablishedWebshopLegitimacy(args: {
  scoringContext?: ScoringIdentityContext;
  intelSurface?: IntelSurfaceInput;
  patterns: DomainPatternAnalysis;
  externalSignals?: ScoreSignal[];
}): EstablishedWebshopLegitimacy {
  const none: EstablishedWebshopLegitimacy = { eligible: false, tier: "none", ageDays: null };

  if (args.intelSurface?.confirmedMalicious) return none;
  if (hasThreatFeedScamHit(args.externalSignals)) return none;
  if (!args.intelSurface?.benignTechnicalBaseline) return none;

  const p = args.patterns;
  if (p.hasStrongLexicalSuspicion) return none;
  if (p.fakeAuthoritySubstringInApex && p.tldRiskTier !== "none") return none;

  const ageDays = args.scoringContext?.ageDaysKnown;
  if (typeof ageDays !== "number" || ageDays < TWO_YEARS_DAYS) return none;

  if (ageDays >= FIVE_YEARS_DAYS) {
    return { eligible: true, tier: "very_strong", ageDays };
  }
  return { eligible: true, tier: "strong", ageDays };
}

/** Max risk (0–100) after legitimacy floor — lower risk ⇒ higher displayed trust. */
export function establishedWebshopMaxRisk(tier: EstablishedWebshopTier): number | null {
  if (tier === "very_strong") return 28;
  if (tier === "strong") return 30;
  return null;
}

/** Review-category positive risk cap when legitimacy anchor is active. */
export const ESTABLISHED_REVIEW_MAX_DOWN = 12;
