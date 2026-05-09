import type { ExternalChecksResult } from "@/lib/checks/types";
import type { ReviewSignals } from "@/lib/reviewSignals";
import { analyzeDomainPatterns, type DomainPatternAnalysis } from "@/lib/domainPatternHeuristics";

export type ScoringIdentityContext = {
  rdapFailed: boolean;
  registrationDateUnknown: boolean;
  registrarUnknown: boolean;
  domainAgeUnknown: boolean;
  ownershipUnverifiable: boolean;
  robotsLikelyBlocked: boolean;
  limitedPublicReputation: boolean;
  /** Present when RDAP returned a usable age estimate. */
  ageDaysKnown?: number;
  domainPatterns: DomainPatternAnalysis;
};

export function buildScoringIdentityContext(
  domain: string,
  checks: ExternalChecksResult,
  reviewSignals: ReviewSignals
): ScoringIdentityContext {
  const di = checks.domainIntelligence;
  /** Successful RDAP runs clear `warnings`; any warning means unavailable, disabled, or error. */
  const rdapFailed = di.warnings.length > 0;
  const registrationDateUnknown = !di.registrationDate;
  const registrarUnknown = !di.registrar;
  const domainAgeUnknown = typeof di.ageDays !== "number";

  const ownershipUnverifiable =
    rdapFailed || (registrationDateUnknown && domainAgeUnknown) || (rdapFailed && registrarUnknown && registrationDateUnknown);

  const robotsLikelyBlocked = reviewSignals.warnings.some((w) =>
    /blocked by robots|robots policy|robots\.txt/i.test(w)
  );

  const limitedPublicReputation = !reviewSignals.googleFound && !reviewSignals.trustpilotFound;

  return {
    rdapFailed,
    registrationDateUnknown,
    registrarUnknown,
    domainAgeUnknown,
    ownershipUnverifiable,
    robotsLikelyBlocked,
    limitedPublicReputation,
    ageDaysKnown: typeof di.ageDays === "number" ? di.ageDays : undefined,
    domainPatterns: analyzeDomainPatterns(domain)
  };
}

export type TrustAnchorFlags = {
  hasStrongReputation: boolean;
  hasAnchoredReputation: boolean;
  hasKnownDomainAgeMonths: boolean;
};

export function computeTrustAnchors(
  ageDaysKnown: number | undefined,
  reviewSignals: ReviewSignals | undefined
): TrustAnchorFlags {
  const tierStrong = (): boolean => {
    if (!reviewSignals) return false;
    const g =
      reviewSignals.googleFound &&
      reviewSignals.googleRating != null &&
      reviewSignals.googleReviewCount != null &&
      reviewSignals.googleRating >= 4.3 &&
      reviewSignals.googleReviewCount >= 100;
    const tp =
      reviewSignals.trustpilotFound &&
      reviewSignals.trustpilotRating != null &&
      reviewSignals.trustpilotReviewCount != null &&
      reviewSignals.trustpilotRating >= 4.3 &&
      reviewSignals.trustpilotReviewCount >= 100;
    return Boolean(g || tp);
  };

  const tierAnchored = (): boolean => {
    if (!reviewSignals) return false;
    const good = (
      rating: number | undefined,
      count: number | undefined,
      found: boolean
    ): boolean => Boolean(found && rating != null && count != null && rating >= 4.0 && count >= 25);
    return good(reviewSignals.googleRating, reviewSignals.googleReviewCount, reviewSignals.googleFound) ||
      good(reviewSignals.trustpilotRating, reviewSignals.trustpilotReviewCount, reviewSignals.trustpilotFound);
  };

  return {
    hasStrongReputation: tierStrong(),
    hasAnchoredReputation: tierAnchored(),
    hasKnownDomainAgeMonths: typeof ageDaysKnown === "number" && ageDaysKnown >= 60
  };
}
