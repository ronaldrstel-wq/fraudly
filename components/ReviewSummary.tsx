"use client";

import type { ReputationEnrichment } from "@/lib/outscraper/reputation";

function formatReviewCount(count: number | null): string {
  if (count == null) return "No reviews found";
  return `${new Intl.NumberFormat("en").format(count)} reviews`;
}

function formatRating(rating: number | null): string {
  if (rating == null) return "No rating found";
  return `${rating.toFixed(1)} / 5`;
}

function normalizeRating(rating: number | null): number {
  if (rating == null || Number.isNaN(rating)) return 0;
  return Math.max(0, Math.min(5, rating));
}

function Stars({ rating }: { rating: number | null }) {
  if (rating == null) {
    return <span className="text-sm text-slate-500">No rating found</span>;
  }

  const clamped = normalizeRating(rating);
  const percentage = (clamped / 5) * 100;

  return (
    <span className="relative inline-block text-sm leading-none" aria-label={`${clamped.toFixed(1)} out of 5 stars`}>
      <span className="text-slate-300">★★★★★</span>
      <span
        className="absolute left-0 top-0 overflow-hidden whitespace-nowrap text-amber-500"
        style={{ width: `${percentage}%` }}
      >
        ★★★★★
      </span>
    </span>
  );
}

function SourceRow({
  name,
  rating,
  reviewCount,
  signalStatus
}: {
  name: string;
  rating: number | null;
  reviewCount: number | null;
  signalStatus: ReputationEnrichment["signalStatus"];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">{name}</p>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
          {signalStatus}
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-sm text-slate-700">
        <Stars rating={rating} />
        <span className="font-medium">{formatRating(rating)}</span>
      </div>
      <p className="mt-1 text-xs text-slate-500">{formatReviewCount(reviewCount)}</p>
    </div>
  );
}

export function ReviewSummary({ enrichment }: { enrichment: ReputationEnrichment }) {
  const hasAnyReviews =
    enrichment.trustpilotRating != null ||
    enrichment.trustpilotReviewCount != null ||
    enrichment.googleRating != null ||
    enrichment.googleReviewCount != null;

  if (!hasAnyReviews) {
    return (
      <p className="text-sm text-slate-600">
        No external review profile found. This does not automatically mean unsafe.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      <SourceRow
        name="Trustpilot"
        rating={enrichment.trustpilotRating}
        reviewCount={enrichment.trustpilotReviewCount}
        signalStatus={enrichment.signalStatus}
      />
      <SourceRow
        name="Google Reviews"
        rating={enrichment.googleRating}
        reviewCount={enrichment.googleReviewCount}
        signalStatus={enrichment.signalStatus}
      />
      <p className="pt-0.5 text-[11px] text-slate-500">External reviews are used as supporting signals only.</p>
    </div>
  );
}

