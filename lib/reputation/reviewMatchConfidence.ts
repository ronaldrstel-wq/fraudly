import type { ReviewSignals } from "@/lib/reviewSignals";
import { sanitizeReviewFields } from "@/lib/reputation/reviewRatingNormalize";

export type ReviewMatchConfidence = "high" | "low" | "none";

export type ResolvedGoogleReview = {
  confidence: ReviewMatchConfidence;
  rating: number | null;
  reviewCount: number | null;
  /** When true, UI may show rating card; when false, show neutral unavailable copy. */
  displayable: boolean;
};

export type ResolvedTrustpilotReview = {
  confidence: ReviewMatchConfidence;
  rating: number | null;
  reviewCount: number | null;
  displayable: boolean;
};

const MIN_COUNT_FOR_DISPLAY = 10;
const MIN_COUNT_FOR_SCORE = 10;

function resolveRatingPair(
  rating: number | null | undefined,
  reviewCount: number | null | undefined
): { confidence: ReviewMatchConfidence; rating: number | null; reviewCount: number | null; displayable: boolean } {
  const sanitized = sanitizeReviewFields(rating, reviewCount);
  const r = sanitized.rating;
  const c = sanitized.reviewCount;

  if (r != null && c != null && c >= MIN_COUNT_FOR_DISPLAY) {
    return { confidence: "high", rating: r, reviewCount: c, displayable: true };
  }
  if (r != null && c == null) {
    return { confidence: "low", rating: r, reviewCount: null, displayable: false };
  }
  if (r == null && c != null && c >= MIN_COUNT_FOR_DISPLAY) {
    return { confidence: "low", rating: null, reviewCount: c, displayable: false };
  }
  return { confidence: "none", rating: null, reviewCount: null, displayable: false };
}

export function resolveGoogleReviewMatch(signals: ReviewSignals): ResolvedGoogleReview {
  const resolved = resolveRatingPair(signals.googleRating, signals.googleReviewCount);
  return { ...resolved, displayable: resolved.displayable };
}

export function resolveTrustpilotReviewMatch(signals: ReviewSignals): ResolvedTrustpilotReview {
  const resolved = resolveRatingPair(signals.trustpilotRating, signals.trustpilotReviewCount);
  return { ...resolved, displayable: resolved.displayable };
}

/** Ratings used for scoring adjustments — requires high confidence and minimum volume. */
export function reviewRatingForScoring(
  rating: number | null,
  reviewCount: number | null,
  confidence: ReviewMatchConfidence
): { rating: number; count: number } | null {
  if (confidence !== "high" || rating == null || reviewCount == null || reviewCount < MIN_COUNT_FOR_SCORE) {
    return null;
  }
  return { rating, count: reviewCount };
}

export const PUBLIC_REVIEW_NOT_MATCHED_COPY =
  "Public review data was not confidently matched for this domain.";
