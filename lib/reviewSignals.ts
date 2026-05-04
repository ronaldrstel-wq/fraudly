import { getCached, normalizeDomain, setCached } from "@/lib/cache";

const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const PLACES_TIMEOUT_MS = 4000;
const REVIEWS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const rawMaxReviews = process.env.MAX_GOOGLE_REVIEW_CALLS_PER_DAY?.trim();
const MAX_GOOGLE_REVIEW_CALLS_PER_DAY =
  rawMaxReviews && Number.isFinite(Number(rawMaxReviews)) && Number(rawMaxReviews) > 0
    ? Number(rawMaxReviews)
    : 500;

export type ReviewSignals = {
  googleFound: boolean;
  googleRating?: number;
  googleReviewCount?: number;

  trustpilotFound: boolean;
  trustpilotRating?: number;
  trustpilotReviewCount?: number;

  recentReviewSummary?: string[];
  suspiciousReviewSignals: string[];

  /** e.g. "Google Places API (searchText)" */
  sources: string[];
  /** Non-fatal issues (missing key, HTTP errors, no hostname match, etc.) */
  warnings: string[];
};

let reviewsBudgetDate = "";
let reviewsApiCallsToday = 0;

function resetDailyBudgetIfNeeded(): void {
  const today = new Date().toISOString().slice(0, 10);
  if (reviewsBudgetDate !== today) {
    reviewsBudgetDate = today;
    reviewsApiCallsToday = 0;
  }
}

function canConsumeGoogleReviewCall(): boolean {
  resetDailyBudgetIfNeeded();
  return reviewsApiCallsToday < MAX_GOOGLE_REVIEW_CALLS_PER_DAY;
}

function recordGoogleReviewCall(): void {
  resetDailyBudgetIfNeeded();
  reviewsApiCallsToday += 1;
}

function stripWww(host: string): string {
  const h = host.toLowerCase().trim();
  return h.startsWith("www.") ? h.slice(4) : h;
}

function normalizeHost(host: string): string {
  return stripWww(host).replace(/\.$/, "");
}

function hostnameFromWebsiteUri(uri: string): string | null {
  try {
    const url = uri.startsWith("http://") || uri.startsWith("https://") ? new URL(uri) : new URL(`https://${uri}`);
    return normalizeHost(url.hostname);
  } catch {
    return null;
  }
}

function websiteHostMatchesCheckedDomain(websiteUri: string, checkedDomain: string): boolean {
  const placeHost = hostnameFromWebsiteUri(websiteUri);
  if (!placeHost) return false;
  return placeHost === normalizeHost(checkedDomain);
}

type PlacesSearchResponse = {
  places?: Array<{
    websiteUri?: string;
    rating?: number;
    userRatingCount?: number;
  }>;
};

export function adjustScoreWithReviewSignals(baseScore: number, reviewSignals: ReviewSignals): number {
  let score = baseScore;

  const ratings: Array<{ rating: number; count: number }> = [];

  if (reviewSignals.googleFound && reviewSignals.googleRating != null) {
    ratings.push({
      rating: reviewSignals.googleRating,
      count: reviewSignals.googleReviewCount ?? 0
    });
  }

  if (reviewSignals.trustpilotFound && reviewSignals.trustpilotRating != null) {
    ratings.push({
      rating: reviewSignals.trustpilotRating,
      count: reviewSignals.trustpilotReviewCount ?? 0
    });
  }

  for (const item of ratings) {
    if (item.rating >= 4.3 && item.count >= 100) score -= 20;
    else if (item.rating >= 4.0 && item.count >= 25) score -= 10;
    else if (item.rating <= 2.5 && item.count >= 10) score += 20;
    else if (item.rating <= 3.2 && item.count >= 25) score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

const emptyTrustpilot = {
  trustpilotFound: false as const,
  trustpilotRating: undefined,
  trustpilotReviewCount: undefined
};

/**
 * Calls Google Places (New) searchText. Returns `{ result, cacheable }` where `cacheable` is false
 * on thrown network/abort errors (do not persist those to cache).
 */
async function fetchGooglePlacesReviewSignals(
  normalizedDomain: string,
  apiKey: string
): Promise<{ result: ReviewSignals; cacheable: boolean }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PLACES_TIMEOUT_MS);

  try {
    const response = await fetch(PLACES_SEARCH_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.websiteUri,places.rating,places.userRatingCount"
      },
      body: JSON.stringify({ textQuery: normalizedDomain })
    });

    const rawBody = await response.text();
    if (!response.ok) {
      return {
        result: {
          googleFound: false,
          ...emptyTrustpilot,
          suspiciousReviewSignals: ["No public review signals found"],
          sources: ["Google Places API (searchText)"],
          warnings: [`Google Places request failed (${response.status}). ${rawBody.slice(0, 200)}`]
        },
        cacheable: true
      };
    }

    let data: PlacesSearchResponse;
    try {
      data = JSON.parse(rawBody) as PlacesSearchResponse;
    } catch {
      return {
        result: {
          googleFound: false,
          ...emptyTrustpilot,
          suspiciousReviewSignals: ["No public review signals found"],
          sources: ["Google Places API (searchText)"],
          warnings: ["Google Places response was not valid JSON."]
        },
        cacheable: true
      };
    }

    const places = data.places ?? [];
    for (const place of places) {
      const websiteUri = place.websiteUri;
      if (!websiteUri || !websiteHostMatchesCheckedDomain(websiteUri, normalizedDomain)) continue;

      const rating = typeof place.rating === "number" ? place.rating : undefined;
      const count = typeof place.userRatingCount === "number" ? place.userRatingCount : undefined;
      if (rating == null || count == null) continue;

      return {
        result: {
          googleFound: true,
          googleRating: rating,
          googleReviewCount: count,
          ...emptyTrustpilot,
          suspiciousReviewSignals: [],
          sources: ["Google Places API (searchText)"],
          warnings: []
        },
        cacheable: true
      };
    }

    return {
      result: {
        googleFound: false,
        ...emptyTrustpilot,
        suspiciousReviewSignals: ["No public review signals found"],
        sources: ["Google Places API (searchText)"],
        warnings: ["No Google Places result matched this domain's website."]
      },
      cacheable: true
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      result: {
        googleFound: false,
        ...emptyTrustpilot,
        suspiciousReviewSignals: ["No public review signals found"],
        sources: ["Google Places API (searchText)"],
        warnings: [`Google Places lookup failed: ${message}`]
      },
      cacheable: false
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetches public Google Places signals for a hostname (server-side only).
 * Results are cached 24h per normalized domain. Daily outbound call cap via env.
 *
 * TODO: Replace Trustpilot mock path with official Trustpilot API integration.
 */
export async function getReviewSignals(domain: string): Promise<ReviewSignals> {
  const normalizedDomain = normalizeDomain(domain);
  const cacheKey = `reviews:${normalizedDomain}`;

  const cached = getCached<ReviewSignals>(cacheKey);
  if (cached) {
    console.log("[Cache] reviews hit:", normalizedDomain);
    return cached;
  }
  console.log("[Cache] reviews miss:", normalizedDomain);

  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) {
    return {
      googleFound: false,
      ...emptyTrustpilot,
      suspiciousReviewSignals: ["No public review signals found"],
      sources: [],
      warnings: ["GOOGLE_MAPS_API_KEY is not configured."]
    };
  }

  if (!canConsumeGoogleReviewCall()) {
    return {
      googleFound: false,
      ...emptyTrustpilot,
      suspiciousReviewSignals: ["No public review signals found"],
      sources: [],
      warnings: ["Google review lookup skipped due to daily API limit."]
    };
  }

  recordGoogleReviewCall();
  const { result, cacheable } = await fetchGooglePlacesReviewSignals(normalizedDomain, apiKey);
  if (cacheable) {
    setCached(cacheKey, result, REVIEWS_CACHE_TTL_MS);
  }
  return result;
}
