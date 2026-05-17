/** Minimum review volume for strong display and trust-score use. */
export const MIN_REVIEWS_FOR_TRUST_SCORE = 5;

/** @deprecated Use {@link MIN_REVIEWS_FOR_TRUST_SCORE}. */
export const MIN_GOOGLE_REVIEWS_FOR_DISPLAY = MIN_REVIEWS_FOR_TRUST_SCORE;

/** @deprecated Use {@link MIN_REVIEWS_FOR_TRUST_SCORE}. */
export const MIN_GOOGLE_REVIEWS_FOR_SCORE = MIN_REVIEWS_FOR_TRUST_SCORE;

/** Minimum match confidence (0–1) before reviews affect trust score. */
export const MIN_CONFIDENCE_FOR_TRUST_SCORE = 0.7;

/** Trustpilot match confidence required before review data affects scoring. */
export const TRUSTPILOT_SCORE_CONFIDENCE_REQUIRED = "high" as const;

/** Max Outscraper Trustpilot queries per enrichment (domain + fallbacks). */
export const MAX_TRUSTPILOT_OUTSCRAPER_ATTEMPTS = 5;

export const PUBLIC_REVIEW_NO_RELIABLE_DATA_COPY = "No reliable public review data found";

export const TRUSTPILOT_MEDIUM_CONFIDENCE_UI_NOTE =
  "Trustpilot match found with moderate confidence.";
