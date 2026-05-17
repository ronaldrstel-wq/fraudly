import type { ReviewSignals } from "@/lib/reviewSignals";
import { sanitizeReviewFields } from "@/lib/reputation/reviewRatingNormalize";
import {
  MIN_CONFIDENCE_FOR_TRUST_SCORE,
  MIN_REVIEWS_FOR_TRUST_SCORE,
  PUBLIC_REVIEW_NO_RELIABLE_DATA_COPY,
  TRUSTPILOT_SCORE_CONFIDENCE_REQUIRED
} from "@/lib/reputation/reviewConfig";
import {
  resolveGoogleReviewChannel,
  resolveTrustpilotReviewChannel,
  reviewRatingForTrustScore
} from "@/lib/reputation/reviewChannelPresentation";
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

function googleMatchConfidenceToLegacy(
  conf: ReviewSignals["googleMatchConfidence"]
): ReviewMatchConfidence {
  if (conf === "high") return "high";
  if (conf === "medium" || conf === "low") return "low";
  return "none";
}

export function resolveGoogleReviewMatch(signals: ReviewSignals): ResolvedGoogleReview {
  const sanitized = sanitizeReviewFields(signals.googleRating, signals.googleReviewCount);
  const enrichmentConf = signals.googleMatchConfidence ?? "none";
  const exactDomain = signals.googleExactDomainMatch === true;
  const legacyConf = googleMatchConfidenceToLegacy(enrichmentConf);

  if (enrichmentConf === "none" && sanitized.rating == null && sanitized.reviewCount == null) {
    return {
      confidence: "none",
      rating: null,
      reviewCount: null,
      displayable: false
    };
  }

  const displayable =
    enrichmentConf === "high" &&
    exactDomain &&
    sanitized.rating != null &&
    sanitized.reviewCount != null &&
    sanitized.reviewCount >= MIN_REVIEWS_FOR_TRUST_SCORE;

  return {
    confidence: displayable ? "high" : legacyConf,
    rating: displayable ? sanitized.rating : null,
    reviewCount: displayable ? sanitized.reviewCount : null,
    displayable
  };
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

  if (rating != null && reviewCount != null && reviewCount >= MIN_REVIEWS_FOR_TRUST_SCORE) {
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
      confidence: reviewCount != null && reviewCount >= MIN_REVIEWS_FOR_TRUST_SCORE ? "high" : "low",
      rating,
      reviewCount,
      displayable: true,
      enrichmentConfidence
    };
  }
  if (reviewCount != null) {
    return {
      confidence: reviewCount >= MIN_REVIEWS_FOR_TRUST_SCORE ? "low" : "low",
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

/** Ratings used for scoring adjustments — gated by found, volume, and confidence. */
export function reviewRatingForScoring(
  rating: number | null,
  reviewCount: number | null,
  confidence: ReviewMatchConfidence,
  opts?: { enrichmentConfidence?: TrustpilotMatchConfidence | "none" }
): { rating: number; count: number } | null {
  if (opts?.enrichmentConfidence === "low") return null;
  const enrichmentScore =
    opts?.enrichmentConfidence === "high"
      ? 0.9
      : opts?.enrichmentConfidence === "medium"
        ? 0.65
        : 0;
  const matchScore = confidence === "high" ? 0.85 : confidence === "low" ? 0.45 : 0;
  const confidenceScore = enrichmentScore > 0 ? enrichmentScore : matchScore;
  if (
    rating == null ||
    reviewCount == null ||
    reviewCount < MIN_REVIEWS_FOR_TRUST_SCORE ||
    confidenceScore < MIN_CONFIDENCE_FOR_TRUST_SCORE
  ) {
    return null;
  }
  return { rating, count: reviewCount };
}

/** Prefer channel presentation when adjusting trust from review signals. */
export function reviewRatingsForScoringFromSignals(signals: ReviewSignals): Array<{ rating: number; count: number }> {
  const out: Array<{ rating: number; count: number }> = [];
  const google = reviewRatingForTrustScore(resolveGoogleReviewChannel(signals));
  const trustpilot = reviewRatingForTrustScore(resolveTrustpilotReviewChannel(signals));
  if (google) out.push(google);
  if (trustpilot) out.push(trustpilot);
  return out;
}

export const PUBLIC_REVIEW_NOT_MATCHED_COPY = PUBLIC_REVIEW_NO_RELIABLE_DATA_COPY;
