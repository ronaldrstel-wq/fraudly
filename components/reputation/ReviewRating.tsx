import {
  basedOnReviewsLine,
  formatRatingOutOfFive,
  reviewRatingAriaLabel,
  sanitizeReviewFields,
  starGlyphsForRating
} from "@/lib/reputation/reviewRatingNormalize";

export type ReviewSourceLabel = "Google Reviews" | "Trustpilot";

export type ReviewRatingProps = {
  source: ReviewSourceLabel;
  rating?: number | null;
  reviewCount?: number | null;
  className?: string;
};

export function ReviewRating({ source, rating, reviewCount, className = "" }: ReviewRatingProps) {
  const { rating: safeRating, reviewCount: safeCount } = sanitizeReviewFields(rating, reviewCount);
  const hasRating = safeRating != null;
  const hasCount = safeCount != null;

  if (!hasRating && !hasCount) {
    return (
      <div className={className}>
        <p className="text-sm font-semibold text-slate-900">{source}</p>
        <p className="mt-1.5 text-sm text-slate-600">No review data available</p>
      </div>
    );
  }

  const aria = reviewRatingAriaLabel(source, safeRating, safeCount);

  return (
    <div className={className} aria-label={aria}>
      <p className="text-sm font-semibold text-slate-900">{source}</p>

      {hasRating ? (
        <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-800">
          <span className="text-base leading-none tracking-tight text-amber-500" aria-hidden>
            {starGlyphsForRating(safeRating)}
          </span>
          <span className="font-semibold tabular-nums">{formatRatingOutOfFive(safeRating)}</span>
        </p>
      ) : (
        <p className="mt-1.5 text-sm text-slate-600">No rating available</p>
      )}

      {hasCount ? (
        <p className="mt-1 text-xs text-slate-600">{basedOnReviewsLine(safeCount)}</p>
      ) : hasRating ? (
        <p className="mt-1 text-xs text-slate-600">Review count unavailable</p>
      ) : null}
    </div>
  );
}
