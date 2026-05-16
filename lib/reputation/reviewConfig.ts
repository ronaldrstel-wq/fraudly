/** Minimum Google review volume required to show rating in consumer UI. */
export const MIN_GOOGLE_REVIEWS_FOR_DISPLAY = 10;

/** Minimum Google review volume that may adjust risk score. */
export const MIN_GOOGLE_REVIEWS_FOR_SCORE = 10;

/** Trustpilot match confidence required before review data affects scoring. */
export const TRUSTPILOT_SCORE_CONFIDENCE_REQUIRED = "high" as const;

/** Max Outscraper Trustpilot queries per enrichment (domain + fallbacks). */
export const MAX_TRUSTPILOT_OUTSCRAPER_ATTEMPTS = 5;

export const PUBLIC_REVIEW_NO_RELIABLE_DATA_COPY = "No reliable public review data found";

export const TRUSTPILOT_MEDIUM_CONFIDENCE_UI_NOTE =
  "Trustpilot match found with moderate confidence.";
