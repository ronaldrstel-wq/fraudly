import type { ExternalChecksResult } from "@/lib/checks/types";
import type { ReviewSignals } from "@/lib/reviewSignals";
import { analyzeDomainPatterns, type DomainPatternAnalysis } from "@/lib/domainPatternHeuristics";
import { resolveGoogleReviewMatch, resolveTrustpilotReviewMatch } from "@/lib/reputation/reviewMatchConfidence";

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
  /** RDAP unavailable only when we have no usable age and provider reported failure/disabled. */
  const rdapFailed = di.warnings.length > 0 && typeof di.ageDays !== "number";
  const registrationDateUnknown = !di.registrationDate;
  const registrarUnknown = !di.registrar;
  const domainAgeUnknown = typeof di.ageDays !== "number";

  /**
   * Unknown ownership should mean "hard to corroborate", not "automatically suspicious".
   * Treat as unverifiable only when registration metadata is broadly absent.
   */
  const ownershipUnverifiable =
    (rdapFailed && registrarUnknown && registrationDateUnknown && domainAgeUnknown) ||
    (!rdapFailed && registrarUnknown && registrationDateUnknown && domainAgeUnknown);

  /**
   * True only when bookkeeping explicitly tags `website_behavior` on the reviewed domain.
   * Third-party directories blocking Fraudly’s collectors do **not** set this bucket.
   */
  const robotsLikelyBlocked =
    Array.isArray(reviewSignals.reviewFetchDebug) && reviewSignals.reviewFetchDebug.some((r) => r.bucket === "website_behavior");

  const limitedPublicReputation =
    !resolveGoogleReviewMatch(reviewSignals).displayable && !resolveTrustpilotReviewMatch(reviewSignals).displayable;

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
    const gMatch = resolveGoogleReviewMatch(reviewSignals);
    const g =
      gMatch.displayable &&
      gMatch.rating != null &&
      gMatch.reviewCount != null &&
      gMatch.rating >= 4.3 &&
      gMatch.reviewCount >= 100;
    const tpMatch = resolveTrustpilotReviewMatch(reviewSignals);
    const tp =
      tpMatch.displayable &&
      tpMatch.rating != null &&
      tpMatch.reviewCount != null &&
      tpMatch.rating >= 4.3 &&
      tpMatch.reviewCount >= 100;
    return Boolean(g || tp);
  };

  const tierAnchored = (): boolean => {
    if (!reviewSignals) return false;
    const good = (
      rating: number | undefined,
      count: number | undefined,
      found: boolean
    ): boolean => Boolean(found && rating != null && count != null && rating >= 4.0 && count >= 25);
    const g = resolveGoogleReviewMatch(reviewSignals);
    const tp = resolveTrustpilotReviewMatch(reviewSignals);
    return good(g.rating ?? undefined, g.reviewCount ?? undefined, g.displayable) ||
      good(tp.rating ?? undefined, tp.reviewCount ?? undefined, tp.displayable);
  };

  return {
    hasStrongReputation: tierStrong(),
    hasAnchoredReputation: tierAnchored(),
    hasKnownDomainAgeMonths: typeof ageDaysKnown === "number" && ageDaysKnown >= 60
  };
}
