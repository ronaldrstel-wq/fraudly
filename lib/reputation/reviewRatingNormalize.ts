/** Clamp and round a star rating for display (0–5, one decimal). */
export function clampReviewRating(rating: number): number {
  const n = Number.isFinite(rating) ? rating : 0;
  const clamped = Math.max(0, Math.min(5, n));
  return Math.round(clamped * 10) / 10;
}

export type SanitizedReviewFields = {
  rating: number | null;
  reviewCount: number | null;
  ratingWasClamped: boolean;
  fieldsWereSwapped: boolean;
};

/**
 * Ensures rating and review count are not confused (e.g. count 8 shown as "8.0/5").
 */
export function sanitizeReviewFields(
  rating: number | null | undefined,
  reviewCount: number | null | undefined
): SanitizedReviewFields {
  let r = rating != null && Number.isFinite(rating) ? rating : null;
  let c =
    reviewCount != null && Number.isFinite(reviewCount) ? Math.max(0, Math.round(reviewCount)) : null;

  let fieldsWereSwapped = false;
  let ratingWasClamped = false;

  if (r != null && r > 5 && c != null && c >= 0 && c <= 5) {
    const swappedRating = c;
    const swappedCount = Math.round(r);
    r = swappedRating;
    c = swappedCount;
    fieldsWereSwapped = true;
    if (process.env.NODE_ENV === "development") {
      console.warn("[reviewRating] Swapped rating and review count (rating looked like a count).", {
        originalRating: rating,
        originalReviewCount: reviewCount
      });
    }
  }

  if (r != null && r > 5 && c == null && Number.isInteger(r) && r <= 1_000_000) {
    c = Math.round(r);
    r = null;
    if (process.env.NODE_ENV === "development") {
      console.warn("[reviewRating] Treated out-of-range rating as review count.", { value: rating });
    }
  }

  if (r != null && (r < 0 || r > 5)) {
    const before = r;
    r = clampReviewRating(r);
    ratingWasClamped = before !== r;
    if (process.env.NODE_ENV === "development") {
      console.warn("[reviewRating] Clamped rating to 0–5.", { before, after: r });
    }
  } else if (r != null) {
    const rounded = clampReviewRating(r);
    ratingWasClamped = rounded !== r;
    r = rounded;
  }

  return { rating: r, reviewCount: c, ratingWasClamped, fieldsWereSwapped };
}

/** Accessible star glyphs: full ★, half ½, empty ☆ (out of 5). */
export function starGlyphsForRating(rating: number): string {
  const r = clampReviewRating(rating);
  const full = Math.floor(r);
  const half = r - full >= 0.5 ? 1 : 0;
  const empty = Math.max(0, 5 - full - half);
  return `${"★".repeat(full)}${half ? "½" : ""}${"☆".repeat(empty)}`;
}

export function formatRatingOutOfFive(rating: number): string {
  return `${clampReviewRating(rating).toFixed(1)} / 5`;
}

export function basedOnReviewsLine(reviewCount: number | null | undefined): string {
  if (reviewCount == null || !Number.isFinite(reviewCount)) {
    return "Review count unavailable";
  }
  const n = Math.max(0, Math.round(reviewCount));
  if (n === 1) return "Based on 1 review";
  return `Based on ${new Intl.NumberFormat("en-US").format(n)} reviews`;
}

export function reviewRatingAriaLabel(
  source: string,
  rating: number | null,
  reviewCount: number | null
): string {
  if (rating != null && reviewCount != null) {
    return `${rating.toFixed(1)} out of 5 stars on ${source}, based on ${reviewCount} reviews`;
  }
  if (rating != null) {
    return `${rating.toFixed(1)} out of 5 stars on ${source}`;
  }
  if (reviewCount != null) {
    return `${source}, based on ${reviewCount} reviews, rating unavailable`;
  }
  return `No review data available for ${source}`;
}
