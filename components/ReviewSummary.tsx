"use client";

import { PublicReviewChannelCard } from "@/components/reputation/PublicReviewChannelCard";
import type { ReputationEnrichment } from "@/lib/outscraper/reputation";
import {
  resolveGoogleReviewChannel,
  resolveTrustpilotReviewChannel
} from "@/lib/reputation/reviewChannelPresentation";
import { mergeReviewSignalsWithEnrichment } from "@/lib/reviewSignals/mergeEnrichment";
import type { NormalizedReviewChannel } from "@/lib/trust/types";

function channelFromPresentation(
  presentation: ReturnType<typeof resolveGoogleReviewChannel>
): NormalizedReviewChannel {
  return {
    rating: presentation.rating,
    reviewCount: presentation.reviewCount,
    confidence: presentation.confidenceScore >= 0.7 ? "high" : presentation.confidenceScore > 0 ? "low" : "none",
    display: null,
    found: presentation.found,
    usedInTrustScore: presentation.usedInTrustScore,
    displayState: presentation.displayState,
    reputationLabel: presentation.reputationLabel,
    scoreImpactLabel: presentation.scoreImpactLabel,
    showMetrics: presentation.showMetrics,
    confidenceScore: presentation.confidenceScore,
    bodyMessage: presentation.bodyMessage
  };
}

export function ReviewSummary({ enrichment }: { enrichment: ReputationEnrichment }) {
  const merged = mergeReviewSignalsWithEnrichment(
    {
      googleFound: false,
      trustpilotFound: false,
      googleRating: enrichment.googleRating ?? enrichment.google?.rating ?? undefined,
      googleReviewCount: enrichment.googleReviewCount ?? enrichment.google?.reviewCount ?? undefined,
      trustpilotRating: enrichment.trustpilotRating ?? enrichment.trustpilot?.rating ?? undefined,
      trustpilotReviewCount: enrichment.trustpilotReviewCount ?? enrichment.trustpilot?.reviewCount ?? undefined,
      trustpilotMatchConfidence: enrichment.trustpilotMatchConfidence,
      suspiciousReviewSignals: [],
      sources: [],
      warnings: [],
      publicReviewAvailabilityNotes: [],
      reviewFetchDebug: []
    },
    enrichment
  );

  const trustpilot = channelFromPresentation(resolveTrustpilotReviewChannel(merged));
  const google = channelFromPresentation(resolveGoogleReviewChannel(merged));

  return (
    <div className="space-y-2.5">
      <PublicReviewChannelCard source="Trustpilot" channel={trustpilot} />
      <PublicReviewChannelCard
        source="Google Reviews"
        channel={google}
        matchNote={merged.googleMatchNote}
      />
      <p className="pt-0.5 text-[11px] text-slate-500">External reviews are supporting signals only.</p>
    </div>
  );
}
