import type { ReputationEnrichment } from "@/lib/outscraper/reputation";
import type { ReviewSignals } from "@/lib/reviewSignals";
import { googleValidationIsDisplayable } from "@/lib/reputation/googleMatch";
import { buildReviewSignalsFromEnrichment } from "@/lib/reputation/reputationProviderResolver";
import { sanitizeReviewFields } from "@/lib/reputation/reviewRatingNormalize";
import type { TrustpilotMatchConfidence } from "@/lib/reputation/trustpilotMatch";

function trustpilotConfidenceFromEnrichment(
  enrichment: ReputationEnrichment
): TrustpilotMatchConfidence | "none" {
  return enrichment.trustpilotMatchConfidence ?? enrichment.trustpilotLookup?.confidence ?? "none";
}

/**
 * Merges paid/public-intel enrichment into scan-time review signals via the central provider resolver.
 * Validated Outscraper data wins; indexed/public baselines remain as Limited when validation fails.
 */
export function mergeReviewSignalsWithEnrichment(
  base: ReviewSignals,
  enrichment: ReputationEnrichment | null | undefined
): ReviewSignals {
  if (!enrichment) return base;
  return buildReviewSignalsFromEnrichment(base, enrichment);
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
