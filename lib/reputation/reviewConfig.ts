/** Minimum review volume for strong display and trust-score use. */
export const MIN_REVIEWS_FOR_TRUST_SCORE = 5;

/** @deprecated Use {@link MIN_REVIEWS_FOR_TRUST_SCORE}. */
export const MIN_GOOGLE_REVIEWS_FOR_DISPLAY = MIN_REVIEWS_FOR_TRUST_SCORE;

/** @deprecated Use {@link MIN_REVIEWS_FOR_TRUST_SCORE}. */
export const MIN_GOOGLE_REVIEWS_FOR_SCORE = MIN_REVIEWS_FOR_TRUST_SCORE;

/** Minimum match confidence (0–1) before reviews affect trust score. */
export const MIN_CONFIDENCE_FOR_TRUST_SCORE = 0.7;

/** Google Business must meet this confidence (and exact domain) before trust score use. */
export const GOOGLE_MIN_CONFIDENCE_FOR_TRUST_SCORE = 0.75;

export const GOOGLE_POSSIBLE_MATCH_UI_NOTE = "Possible Google business match found";

export const GOOGLE_UNVERIFIED_UI_NOTE = "Public review data could not be reliably verified";

/** Trustpilot match confidence required before review data affects scoring. */
export const TRUSTPILOT_SCORE_CONFIDENCE_REQUIRED = "high" as const;

/** Max Outscraper Trustpilot queries per enrichment (domain + fallbacks). */
export const MAX_TRUSTPILOT_OUTSCRAPER_ATTEMPTS = 5;

export const PUBLIC_REVIEW_NO_RELIABLE_DATA_COPY = "No reliable public review data found";

export const TRUSTPILOT_MEDIUM_CONFIDENCE_UI_NOTE =
  "Trustpilot match found with moderate confidence.";
