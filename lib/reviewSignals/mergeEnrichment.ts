import type { ReputationEnrichment } from "@/lib/outscraper/reputation";
import type { ReviewSignals } from "@/lib/reviewSignals";
import {
  GOOGLE_POSSIBLE_MATCH_UI_NOTE,
  GOOGLE_UNVERIFIED_UI_NOTE,
  TRUSTPILOT_MEDIUM_CONFIDENCE_UI_NOTE
} from "@/lib/reputation/reviewConfig";
import { googleValidationIsDisplayable } from "@/lib/reputation/googleMatch";
import {
  resolveGoogleReviewMatch,
  resolveTrustpilotReviewMatch
} from "@/lib/reputation/reviewMatchConfidence";
import { sanitizeReviewFields } from "@/lib/reputation/reviewRatingNormalize";
import type { GoogleMatchConfidence } from "@/lib/reputation/googleMatch";
import type { TrustpilotMatchConfidence } from "@/lib/reputation/trustpilotMatch";

function preferEnrichmentRating(
  current: number | undefined,
  enrichment: number | null | undefined
): number | undefined {
  if (enrichment == null || !Number.isFinite(enrichment)) return current;
  return enrichment;
}

function preferEnrichmentCount(
  current: number | undefined,
  enrichment: number | null | undefined
): number | undefined {
  if (enrichment == null || !Number.isFinite(enrichment)) return current;
  return enrichment;
}

function trustpilotConfidenceFromEnrichment(
  enrichment: ReputationEnrichment
): TrustpilotMatchConfidence | "none" {
  return enrichment.trustpilotMatchConfidence ?? enrichment.trustpilotLookup?.confidence ?? "none";
}

function googleConfidenceFromEnrichment(enrichment: ReputationEnrichment): GoogleMatchConfidence | "none" {
  return enrichment.googleMatchConfidence ?? enrichment.googleLookup?.confidence ?? "none";
}

function googleFieldsFromEnrichment(enrichment: ReputationEnrichment): Pick<
  ReviewSignals,
  | "googleMatchConfidence"
  | "googleMatchScore"
  | "googleExactDomainMatch"
  | "googleMatchedBusinessName"
  | "googleMatchedWebsite"
  | "googleMatchNote"
> {
  const lookup = enrichment.googleLookup;
  const confidence = googleConfidenceFromEnrichment(enrichment);
  const exactDomainMatch = lookup?.exactDomainMatch === true;
  const displayable = confidence === "high" && exactDomainMatch;

  let googleMatchNote: string | undefined;
  if (confidence === "medium" || (confidence === "low" && lookup?.matchedBusinessName)) {
    googleMatchNote = GOOGLE_POSSIBLE_MATCH_UI_NOTE;
  } else if (confidence === "low" || confidence === "none") {
    googleMatchNote = GOOGLE_UNVERIFIED_UI_NOTE;
  }

  return {
    googleMatchConfidence: confidence,
    googleMatchScore: lookup?.confidenceScore,
    googleExactDomainMatch: exactDomainMatch,
    googleMatchedBusinessName: lookup?.matchedBusinessName ?? undefined,
    googleMatchedWebsite: lookup?.googleWebsite ?? undefined,
    googleMatchNote: displayable ? undefined : googleMatchNote
  };
}

/**
 * Merges paid/public-intel enrichment into scan-time review signals.
 * Google and Trustpilot values are only merged when entity validation passes display gates.
 */
export function mergeReviewSignalsWithEnrichment(
  base: ReviewSignals,
  enrichment: ReputationEnrichment | null | undefined
): ReviewSignals {
  if (!enrichment) return base;

  const googleMeta = googleFieldsFromEnrichment(enrichment);
  const googleDisplayable =
    googleMeta.googleMatchConfidence === "high" && googleMeta.googleExactDomainMatch === true;

  const googleRating = googleDisplayable
    ? preferEnrichmentRating(base.googleRating, enrichment.googleRating ?? enrichment.google?.rating)
    : base.googleRating;
  const googleReviewCount = googleDisplayable
    ? preferEnrichmentCount(
        base.googleReviewCount,
        enrichment.googleReviewCount ?? enrichment.google?.reviewCount
      )
    : base.googleReviewCount;

  const tpConfidence = trustpilotConfidenceFromEnrichment(enrichment);
  const trustpilotAllowed = tpConfidence === "high" || tpConfidence === "medium";

  const trustpilotRating = trustpilotAllowed
    ? preferEnrichmentRating(base.trustpilotRating, enrichment.trustpilotRating ?? enrichment.trustpilot?.rating)
    : base.trustpilotRating;
  const trustpilotReviewCount = trustpilotAllowed
    ? preferEnrichmentCount(
        base.trustpilotReviewCount,
        enrichment.trustpilotReviewCount ?? enrichment.trustpilot?.reviewCount
      )
    : base.trustpilotReviewCount;

  const merged: ReviewSignals = {
    ...base,
    googleRating,
    googleReviewCount,
    trustpilotRating,
    trustpilotReviewCount,
    ...googleMeta,
    trustpilotMatchConfidence: trustpilotAllowed ? tpConfidence : base.trustpilotMatchConfidence ?? "none",
    trustpilotMatchNote:
      tpConfidence === "medium"
        ? TRUSTPILOT_MEDIUM_CONFIDENCE_UI_NOTE
        : base.trustpilotMatchNote
  };

  const googleMatch = resolveGoogleReviewMatch(merged);
  const trustpilotMatch = resolveTrustpilotReviewMatch(merged);

  const sources = [...base.sources];
  if (!sources.includes("Public reputation enrichment")) {
    sources.push("Public reputation enrichment");
  }

  return {
    ...merged,
    sources,
    googleFound: googleMatch.displayable,
    googleRating: googleMatch.displayable ? googleMatch.rating ?? undefined : undefined,
    googleReviewCount: googleMatch.displayable ? googleMatch.reviewCount ?? undefined : undefined,
    trustpilotFound: trustpilotMatch.displayable,
    trustpilotRating: trustpilotMatch.displayable ? trustpilotMatch.rating ?? undefined : undefined,
    trustpilotReviewCount: trustpilotMatch.displayable ? trustpilotMatch.reviewCount ?? undefined : undefined
  };
}

export function enrichmentHasDisplayableReviews(enrichment: ReputationEnrichment | null | undefined): boolean {
  if (!enrichment) return false;
  const google = sanitizeReviewFields(enrichment.googleRating, enrichment.googleReviewCount);
  const trustpilot = sanitizeReviewFields(enrichment.trustpilotRating, enrichment.trustpilotReviewCount);
  const googleOk =
    googleValidationIsDisplayable({
      accepted: true,
      confidence: enrichment.googleLookup?.confidence ?? "none",
      score: enrichment.googleLookup?.confidenceScore ?? 0,
      exactDomainMatch: enrichment.googleLookup?.exactDomainMatch === true,
      reasons: []
    }) && google.rating != null && google.reviewCount != null;
  const tpConf = trustpilotConfidenceFromEnrichment(enrichment);
  const trustpilotOk =
    (tpConf === "high" || tpConf === "medium") && (trustpilot.rating != null || trustpilot.reviewCount != null);
  return googleOk || trustpilotOk;
}
