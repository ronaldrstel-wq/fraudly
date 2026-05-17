import type { ReviewSignals } from "@/lib/reviewSignals";
import {
  GOOGLE_MIN_CONFIDENCE_FOR_TRUST_SCORE,
  GOOGLE_POSSIBLE_MATCH_UI_NOTE,
  GOOGLE_UNVERIFIED_UI_NOTE,
  MIN_CONFIDENCE_FOR_TRUST_SCORE,
  MIN_REVIEWS_FOR_TRUST_SCORE
} from "@/lib/reputation/reviewConfig";
import { assessGoogleReviewEvidence, googlePossibleMatchFound } from "@/lib/reputation/googleReviewRules";
import { resolveTrustpilotReviewMatch } from "@/lib/reputation/reviewMatchConfidence";
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
  /** Consumer-facing line when not showing metrics. */
  bodyMessage: string;
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

function googleConfidenceScore(signals: ReviewSignals): number {
  if (typeof signals.googleMatchScore === "number" && Number.isFinite(signals.googleMatchScore)) {
    return signals.googleMatchScore;
  }
  switch (signals.googleMatchConfidence) {
    case "high":
      return 0.95;
    case "medium":
      return 0.65;
    case "low":
      return 0.4;
    default:
      return 0;
  }
}

function meetsTrustScoreGate(
  found: boolean,
  rating: number | null,
  reviewCount: number | null,
  confidenceScore: number,
  minConfidence = MIN_CONFIDENCE_FOR_TRUST_SCORE
): boolean {
  return (
    found &&
    rating != null &&
    reviewCount != null &&
    reviewCount >= MIN_REVIEWS_FOR_TRUST_SCORE &&
    confidenceScore >= minConfidence
  );
}

function meetsGoogleTrustScoreGate(
  signals: ReviewSignals,
  rating: number | null,
  reviewCount: number | null,
  confidenceScore: number
): boolean {
  return (
    signals.googleMatchConfidence === "high" &&
    signals.googleExactDomainMatch === true &&
    meetsTrustScoreGate(true, rating, reviewCount, confidenceScore, GOOGLE_MIN_CONFIDENCE_FOR_TRUST_SCORE)
  );
}

function buildChannelPresentation(args: {
  source: ReviewChannelSource;
  found: boolean;
  rating: number | null;
  reviewCount: number | null;
  confidenceScore: number;
  forceLowConfidence?: boolean;
  lowConfidenceMessage?: string;
  meetsScoreGate?: (
    found: boolean,
    rating: number | null,
    reviewCount: number | null,
    confidenceScore: number
  ) => boolean;
}): ReviewChannelPresentation {
  const {
    source,
    found,
    rating,
    reviewCount,
    confidenceScore,
    forceLowConfidence,
    lowConfidenceMessage,
    meetsScoreGate = meetsTrustScoreGate
  } = args;

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
      showMetrics: false,
      bodyMessage: "No public reviews found"
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
      showMetrics: false,
      bodyMessage: lowConfidenceMessage ?? "Possible match found, not used in score"
    };
  }

  const usedInTrustScore = meetsScoreGate(found, rating, reviewCount, confidenceScore);

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
      showMetrics: true,
      bodyMessage: ""
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
    showMetrics: false,
    bodyMessage: "Limited review data"
  };
}

export function resolveGoogleReviewChannel(signals: ReviewSignals): ReviewChannelPresentation {
  const ev = assessGoogleReviewEvidence(signals);
  const confidenceScore = googleConfidenceScore(signals);

  if (!ev.hasSource) {
    return buildChannelPresentation({
      source: "Google Reviews",
      found: false,
      rating: null,
      reviewCount: null,
      confidenceScore: 0
    });
  }

  if (ev.validated && ev.rating != null && ev.reviewCount != null) {
    return buildChannelPresentation({
      source: "Google Reviews",
      found: true,
      rating: ev.rating,
      reviewCount: ev.reviewCount,
      confidenceScore,
      meetsScoreGate: (_found, rating, reviewCount, score) =>
        meetsGoogleTrustScoreGate(signals, rating, reviewCount, score)
    });
  }

  if (googlePossibleMatchFound(signals) || ev.enrichmentConf === "medium" || ev.enrichmentConf === "low") {
    return buildChannelPresentation({
      source: "Google Reviews",
      found: true,
      rating: null,
      reviewCount: null,
      confidenceScore,
      forceLowConfidence: true,
      lowConfidenceMessage: signals.googleMatchNote ?? GOOGLE_POSSIBLE_MATCH_UI_NOTE
    });
  }

  if (ev.hasFullPublicMetrics) {
    return {
      source: "Google Reviews",
      found: true,
      rating: ev.rating,
      reviewCount: ev.reviewCount,
      confidenceScore: Math.max(confidenceScore, 0.45),
      usedInTrustScore: false,
      displayState: "limited",
      reputationLabel: ev.rating != null ? reputationLabelFromRating(ev.rating) : null,
      scoreImpactLabel: REVIEW_SCORE_IMPACT.notEnoughData,
      showMetrics: true,
      bodyMessage: "Limited review data"
    };
  }

  if (ev.rating != null && ev.reviewCount == null) {
    return buildChannelPresentation({
      source: "Google Reviews",
      found: true,
      rating: null,
      reviewCount: null,
      confidenceScore: Math.max(confidenceScore, 0.45),
      forceLowConfidence: true,
      lowConfidenceMessage: "Limited review data"
    });
  }

  return buildChannelPresentation({
    source: "Google Reviews",
    found: true,
    rating: null,
    reviewCount: null,
    confidenceScore,
    forceLowConfidence: true,
    lowConfidenceMessage: GOOGLE_UNVERIFIED_UI_NOTE
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
