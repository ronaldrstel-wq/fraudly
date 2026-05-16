import type { ReputationEnrichment } from "@/lib/outscraper/reputation";
import type { ReviewSignals } from "@/lib/reviewSignals";
import {
  resolveGoogleReviewMatch,
  resolveTrustpilotReviewMatch
} from "@/lib/reputation/reviewMatchConfidence";
import { sanitizeReviewFields } from "@/lib/reputation/reviewRatingNormalize";

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

/**
 * Merges paid/public-intel enrichment into scan-time review signals.
 * Enrichment wins when it supplies displayable rating/count pairs.
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
  const trustpilotRating = preferEnrichmentRating(
    base.trustpilotRating,
    enrichment.trustpilotRating ?? enrichment.trustpilot?.rating
  );
  const trustpilotReviewCount = preferEnrichmentCount(
    base.trustpilotReviewCount,
    enrichment.trustpilotReviewCount ?? enrichment.trustpilot?.reviewCount
  );

  const googleMatch = resolveGoogleReviewMatch({
    ...base,
    googleRating,
    googleReviewCount
  });
  const trustpilotMatch = resolveTrustpilotReviewMatch({
    ...base,
    trustpilotRating,
    trustpilotReviewCount
  });

  const sources = [...base.sources];
  if (enrichment.source === "public-intel" && !sources.includes("Public reputation enrichment")) {
    sources.push("Public reputation enrichment");
  }

  return {
    ...base,
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
  const trustpilotOk = trustpilot.rating != null || trustpilot.reviewCount != null;
  return googleOk || trustpilotOk;
}
