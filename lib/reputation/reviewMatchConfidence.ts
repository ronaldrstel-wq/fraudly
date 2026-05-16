import type { ReviewSignals } from "@/lib/reviewSignals";
import { sanitizeReviewFields } from "@/lib/reputation/reviewRatingNormalize";
import {
  MIN_GOOGLE_REVIEWS_FOR_DISPLAY,
  MIN_GOOGLE_REVIEWS_FOR_SCORE,
  PUBLIC_REVIEW_NO_RELIABLE_DATA_COPY,
  TRUSTPILOT_SCORE_CONFIDENCE_REQUIRED
} from "@/lib/reputation/reviewConfig";
import type { TrustpilotMatchConfidence } from "@/lib/reputation/trustpilotMatch";

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
  enrichmentConfidence?: TrustpilotMatchConfidence | "none";
};

function resolveGoogleRatingPair(
  rating: number | null | undefined,
  reviewCount: number | null | undefined
): { confidence: ReviewMatchConfidence; rating: number | null; reviewCount: number | null; displayable: boolean } {
  const sanitized = sanitizeReviewFields(rating, reviewCount);
  const r = sanitized.rating;
  const c = sanitized.reviewCount;

  if (r != null && c != null && c >= MIN_GOOGLE_REVIEWS_FOR_DISPLAY) {
    return { confidence: "high", rating: r, reviewCount: c, displayable: true };
  }
  if (r != null && c == null) {
    return { confidence: "low", rating: r, reviewCount: null, displayable: false };
  }
  if (r == null && c != null && c >= MIN_GOOGLE_REVIEWS_FOR_DISPLAY) {
    return { confidence: "low", rating: null, reviewCount: c, displayable: false };
  }
  return { confidence: "none", rating: null, reviewCount: null, displayable: false };
}

export function resolveGoogleReviewMatch(signals: ReviewSignals): ResolvedGoogleReview {
  return resolveGoogleRatingPair(signals.googleRating, signals.googleReviewCount);
}

function enrichmentAllowsTrustpilotDisplay(
  confidence: TrustpilotMatchConfidence | "none" | undefined
): boolean {
  return confidence === "high" || confidence === "medium";
}

export function resolveTrustpilotReviewMatch(signals: ReviewSignals): ResolvedTrustpilotReview {
  const enrichmentConfidence = signals.trustpilotMatchConfidence ?? "none";
  if (signals.trustpilotMatchConfidence && !enrichmentAllowsTrustpilotDisplay(enrichmentConfidence)) {
    return {
      confidence: "none",
      rating: null,
      reviewCount: null,
      displayable: false,
      enrichmentConfidence
    };
  }

  const sanitized = sanitizeReviewFields(signals.trustpilotRating, signals.trustpilotReviewCount);
  const rating = sanitized.rating;
  const reviewCount = sanitized.reviewCount;

  if (rating == null && reviewCount == null) {
    return {
      confidence: "none",
      rating: null,
      reviewCount: null,
      displayable: false,
      enrichmentConfidence
    };
  }

  const displayable = enrichmentAllowsTrustpilotDisplay(enrichmentConfidence) || enrichmentConfidence === "none";
  if (!displayable) {
    return {
      confidence: "none",
      rating: null,
      reviewCount: null,
      displayable: false,
      enrichmentConfidence
    };
  }

  if (rating != null && reviewCount != null && reviewCount >= MIN_GOOGLE_REVIEWS_FOR_DISPLAY) {
    return {
      confidence: "high",
      rating,
      reviewCount,
      displayable: true,
      enrichmentConfidence
    };
  }
  if (rating != null) {
    return {
      confidence: reviewCount != null && reviewCount >= MIN_GOOGLE_REVIEWS_FOR_DISPLAY ? "high" : "low",
      rating,
      reviewCount,
      displayable: true,
      enrichmentConfidence
    };
  }
  if (reviewCount != null) {
    return {
      confidence: reviewCount >= MIN_GOOGLE_REVIEWS_FOR_DISPLAY ? "low" : "low",
      rating: null,
      reviewCount,
      displayable: true,
      enrichmentConfidence
    };
  }

  return {
    confidence: "none",
    rating: null,
    reviewCount: null,
    displayable: false,
    enrichmentConfidence
  };
}

/** Ratings used for scoring adjustments — requires high confidence and minimum volume. */
export function reviewRatingForScoring(
  rating: number | null,
  reviewCount: number | null,
  confidence: ReviewMatchConfidence,
  opts?: { enrichmentConfidence?: TrustpilotMatchConfidence | "none" }
): { rating: number; count: number } | null {
  if (
    opts?.enrichmentConfidence === "medium" ||
    opts?.enrichmentConfidence === "low" ||
    opts?.enrichmentConfidence === "none"
  ) {
    return null;
  }
  if (confidence !== "high" || rating == null || reviewCount == null || reviewCount < MIN_GOOGLE_REVIEWS_FOR_SCORE) {
    return null;
  }
  return { rating, count: reviewCount };
}

export const PUBLIC_REVIEW_NOT_MATCHED_COPY = PUBLIC_REVIEW_NO_RELIABLE_DATA_COPY;
