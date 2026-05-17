import type { ReviewSignals } from "@/lib/reviewSignals";
import { MIN_REVIEWS_FOR_TRUST_SCORE } from "@/lib/reputation/reviewConfig";
import { sanitizeReviewFields } from "@/lib/reputation/reviewRatingNormalize";

export type GoogleEnrichmentConfidence = "high" | "medium" | "low" | "none";

export type GoogleReviewEvidence = {
  hasSource: boolean;
  rating: number | null;
  reviewCount: number | null;
  enrichmentConf: GoogleEnrichmentConfidence;
  exactDomain: boolean;
  /** Outscraper-validated: high confidence + exact domain match. */
  validated: boolean;
  /** Rating and count both present with count >= {@link MIN_REVIEWS_FOR_TRUST_SCORE}. */
  hasFullPublicMetrics: boolean;
  /** Rating without count, count without rating, or volume below minimum. */
  hasPartialMetrics: boolean;
};

/** Deterministic assessment of Google review inputs (display + match layers). */
export function assessGoogleReviewEvidence(signals: ReviewSignals): GoogleReviewEvidence {
  const sanitized = sanitizeReviewFields(signals.googleRating, signals.googleReviewCount);
  const enrichmentConf: GoogleEnrichmentConfidence = signals.googleMatchConfidence ?? "none";
  const exactDomain = signals.googleExactDomainMatch === true;
  const validated = enrichmentConf === "high" && exactDomain;

  const hasRating = sanitized.rating != null;
  const hasCount = sanitized.reviewCount != null;
  const hasFullPublicMetrics =
    hasRating && hasCount && sanitized.reviewCount! >= MIN_REVIEWS_FOR_TRUST_SCORE;
  const hasPartialMetrics =
    (hasRating && !hasCount) ||
    (!hasRating && hasCount) ||
    (hasRating && hasCount && sanitized.reviewCount! < MIN_REVIEWS_FOR_TRUST_SCORE);

  const hasSource =
    signals.googleFound ||
    hasRating ||
    hasCount ||
    enrichmentConf !== "none" ||
    Boolean(signals.googleMatchNote);

  return {
    hasSource,
    rating: sanitized.rating,
    reviewCount: sanitized.reviewCount,
    enrichmentConf,
    exactDomain,
    validated,
    hasFullPublicMetrics,
    hasPartialMetrics
  };
}

export function googlePossibleMatchFound(signals: ReviewSignals): boolean {
  const conf = signals.googleMatchConfidence;
  if (conf === "medium" || conf === "low") return true;
  if (conf === "high" && signals.googleExactDomainMatch !== true) return true;
  return Boolean(signals.googleMatchNote?.includes("Possible"));
}
