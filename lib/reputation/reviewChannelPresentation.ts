import type { ReviewSignals } from "@/lib/reviewSignals";
import {
  MIN_CONFIDENCE_FOR_TRUST_SCORE,
  MIN_REVIEWS_FOR_TRUST_SCORE
} from "@/lib/reputation/reviewConfig";
import {
  resolveGoogleReviewMatch,
  resolveTrustpilotReviewMatch
} from "@/lib/reputation/reviewMatchConfidence";
import { sanitizeReviewFields } from "@/lib/reputation/reviewRatingNormalize";
import type { TrustpilotMatchConfidence } from "@/lib/reputation/trustpilotMatch";

export type ReviewChannelSource = "Trustpilot" | "Google Reviews";

export type ReviewChannelDisplayState = "strong" | "limited" | "none" | "low_confidence";

export type ReviewReputationLabel = "Positive" | "Mixed" | "Poor";

export type ReviewChannelPresentation = {
  source: ReviewChannelSource;
  found: boolean;
  rating: number | null;
  reviewCount: number | null;
  /** Normalized 0–1 match confidence for scoring gates. */
  confidenceScore: number;
  usedInTrustScore: boolean;
  displayState: ReviewChannelDisplayState;
  reputationLabel: ReviewReputationLabel | null;
  scoreImpactLabel: string;
  /** When true, show numeric rating + count (never rating without count). */
  showMetrics: boolean;
};

export const REVIEW_SCORE_IMPACT = {
  usedInTrustScore: "Used in trust score",
  notEnoughData: "Checked, not enough data",
  noPublicReviews: "Checked, no public reviews found",
  possibleMismatch: "Checked, possible mismatch"
} as const;

function reputationLabelFromRating(rating: number): ReviewReputationLabel {
  if (rating >= 4) return "Positive";
  if (rating >= 3) return "Mixed";
  return "Poor";
}

function enrichmentConfidenceScore(conf: TrustpilotMatchConfidence | "none" | undefined): number {
  switch (conf) {
    case "high":
      return 0.9;
    case "medium":
      return 0.65;
    case "low":
      return 0.4;
    default:
      return 0;
  }
}

function matchConfidenceScore(conf: "high" | "low" | "none"): number {
  if (conf === "high") return 0.85;
  if (conf === "low") return 0.45;
  return 0;
}

function meetsTrustScoreGate(
  found: boolean,
  rating: number | null,
  reviewCount: number | null,
  confidenceScore: number
): boolean {
  return (
    found &&
    rating != null &&
    reviewCount != null &&
    reviewCount >= MIN_REVIEWS_FOR_TRUST_SCORE &&
    confidenceScore >= MIN_CONFIDENCE_FOR_TRUST_SCORE
  );
}

function buildChannelPresentation(args: {
  source: ReviewChannelSource;
  found: boolean;
  rating: number | null;
  reviewCount: number | null;
  confidenceScore: number;
  forceLowConfidence?: boolean;
}): ReviewChannelPresentation {
  const { source, found, rating, reviewCount, confidenceScore, forceLowConfidence } = args;

  if (!found) {
    return {
      source,
      found: false,
      rating: null,
      reviewCount: null,
      confidenceScore: 0,
      usedInTrustScore: false,
      displayState: "none",
      reputationLabel: null,
      scoreImpactLabel: REVIEW_SCORE_IMPACT.noPublicReviews,
      showMetrics: false
    };
  }

  const hasRatingAndCount = rating != null && reviewCount != null;
  const limitedByVolume =
    hasRatingAndCount && reviewCount < MIN_REVIEWS_FOR_TRUST_SCORE;

  if (
    forceLowConfidence ||
    (confidenceScore < MIN_CONFIDENCE_FOR_TRUST_SCORE && !limitedByVolume)
  ) {
    return {
      source,
      found: true,
      rating: null,
      reviewCount: null,
      confidenceScore,
      usedInTrustScore: false,
      displayState: "low_confidence",
      reputationLabel: null,
      scoreImpactLabel: REVIEW_SCORE_IMPACT.possibleMismatch,
      showMetrics: false
    };
  }

  const usedInTrustScore = meetsTrustScoreGate(found, rating, reviewCount, confidenceScore);

  if (hasRatingAndCount && reviewCount >= MIN_REVIEWS_FOR_TRUST_SCORE) {
    return {
      source,
      found: true,
      rating,
      reviewCount,
      confidenceScore,
      usedInTrustScore,
      displayState: "strong",
      reputationLabel: reputationLabelFromRating(rating),
      scoreImpactLabel: usedInTrustScore
        ? REVIEW_SCORE_IMPACT.usedInTrustScore
        : REVIEW_SCORE_IMPACT.notEnoughData,
      showMetrics: true
    };
  }

  return {
    source,
    found: true,
    rating,
    reviewCount,
    confidenceScore,
    usedInTrustScore: false,
    displayState: "limited",
    reputationLabel: null,
    scoreImpactLabel: REVIEW_SCORE_IMPACT.notEnoughData,
    showMetrics: false
  };
}

export function resolveGoogleReviewChannel(signals: ReviewSignals): ReviewChannelPresentation {
  const match = resolveGoogleReviewMatch(signals);
  const sanitized = sanitizeReviewFields(signals.googleRating, signals.googleReviewCount);
  const found = sanitized.rating != null || sanitized.reviewCount != null;
  const confidenceScore = matchConfidenceScore(match.confidence);

  return buildChannelPresentation({
    source: "Google Reviews",
    found,
    rating: sanitized.rating,
    reviewCount: sanitized.reviewCount,
    confidenceScore
  });
}

export function resolveTrustpilotReviewChannel(signals: ReviewSignals): ReviewChannelPresentation {
  const enrichmentConf = signals.trustpilotMatchConfidence ?? "none";
  const match = resolveTrustpilotReviewMatch(signals);
  const sanitized = sanitizeReviewFields(signals.trustpilotRating, signals.trustpilotReviewCount);
  const hasMetrics = sanitized.rating != null || sanitized.reviewCount != null;
  const found = hasMetrics || enrichmentConf !== "none";

  const fromEnrichment = enrichmentConfidenceScore(enrichmentConf);
  const confidenceScore =
    fromEnrichment > 0 ? fromEnrichment : matchConfidenceScore(match.confidence);

  const forceLowConfidence =
    enrichmentConf === "low" ||
    (enrichmentConf === "medium" && confidenceScore < MIN_CONFIDENCE_FOR_TRUST_SCORE);

  return buildChannelPresentation({
    source: "Trustpilot",
    found,
    rating: sanitized.rating,
    reviewCount: sanitized.reviewCount,
    confidenceScore,
    forceLowConfidence
  });
}

/** Ratings that may adjust risk score — mirrors product gates for trust calculation. */
export function reviewRatingForTrustScore(
  channel: Pick<
    ReviewChannelPresentation,
    "found" | "rating" | "reviewCount" | "confidenceScore" | "usedInTrustScore"
  >
): { rating: number; count: number } | null {
  if (!channel.usedInTrustScore || channel.rating == null || channel.reviewCount == null) {
    return null;
  }
  if (!meetsTrustScoreGate(channel.found, channel.rating, channel.reviewCount, channel.confidenceScore)) {
    return null;
  }
  return { rating: channel.rating, count: channel.reviewCount };
}
