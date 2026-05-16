"use client";

import { ReviewRating } from "@/components/reputation/ReviewRating";
import type { ReputationEnrichment } from "@/lib/outscraper/reputation";

export function ReviewSummary({ enrichment }: { enrichment: ReputationEnrichment }) {
  const trustpilotRating = enrichment.trustpilotRating ?? enrichment.trustpilot?.rating ?? null;
  const trustpilotReviewCount = enrichment.trustpilotReviewCount ?? enrichment.trustpilot?.reviewCount ?? null;
  const googleRating = enrichment.googleRating ?? enrichment.google?.rating ?? null;
  const googleReviewCount = enrichment.googleReviewCount ?? enrichment.google?.reviewCount ?? null;

  const hasAnyReviews =
    trustpilotRating != null ||
    trustpilotReviewCount != null ||
    googleRating != null ||
    googleReviewCount != null;

  if (!hasAnyReviews) {
    return (
      <p className="text-sm text-slate-600">
        No external review profile found. This does not automatically mean unsafe.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      <ReviewRating
        source="Trustpilot"
        rating={trustpilotRating}
        reviewCount={trustpilotReviewCount}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5"
      />
      <ReviewRating
        source="Google Reviews"
        rating={googleRating}
        reviewCount={googleReviewCount}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5"
      />
      <p className="pt-0.5 text-[11px] text-slate-500">External reviews are used as supporting signals only.</p>
    </div>
  );
}
