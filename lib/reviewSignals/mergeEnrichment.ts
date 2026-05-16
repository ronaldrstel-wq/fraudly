import type { ReputationEnrichment } from "@/lib/outscraper/reputation";
import type { ReviewSignals } from "@/lib/reviewSignals";
import { TRUSTPILOT_MEDIUM_CONFIDENCE_UI_NOTE } from "@/lib/reputation/reviewConfig";
import {
  resolveGoogleReviewMatch,
  resolveTrustpilotReviewMatch
} from "@/lib/reputation/reviewMatchConfidence";
import { sanitizeReviewFields } from "@/lib/reputation/reviewRatingNormalize";
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

/**
 * Merges paid/public-intel enrichment into scan-time review signals.
 * Trustpilot values are only merged when Outscraper validation is high or medium.
 */
export function mergeReviewSignalsWithEnrichment(
  base: ReviewSignals,
  enrichment: ReputationEnrichment | null | undefined
): ReviewSignals {
  if (!enrichment) return base;

  const googleRating = preferEnrichmentRating(base.googleRating, enrichment.googleRating ?? enrichment.google?.rating);
  const googleReviewCount = preferEnrichmentCount(
    base.googleReviewCount,
    enrichment.googleReviewCount ?? enrichment.google?.reviewCount
  );

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
  const googleOk = google.rating != null && google.reviewCount != null;
  const tpConf = trustpilotConfidenceFromEnrichment(enrichment);
  const trustpilotOk =
    (tpConf === "high" || tpConf === "medium") && (trustpilot.rating != null || trustpilot.reviewCount != null);
  return googleOk || trustpilotOk;
}
