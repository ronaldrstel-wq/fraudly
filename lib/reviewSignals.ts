import { getCached, normalizeDomain, setCached } from "@/lib/cache";
import { getReputationEnrichment } from "@/lib/outscraper/reputation";

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
  outscraper?: {
    source: "Outscraper Google Reviews";
    available: boolean;
    rating: number | null;
    reviewCount: number | null;
    negativeReviewRatio: number | null;
    strongestComplaintThemes: string[];
    confidence: "low" | "medium" | "high";
    negativeTrend: boolean;
    suspiciousPositivePattern: boolean;
    businessIdentityMismatch: boolean;
    businessAddress?: string | null;
    businessPhone?: string | null;
    businessCategory?: string | null;
    websiteMatch?: boolean | null;
  };

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

function inferNegativeRatio(rating: number | null): number | null {
  if (rating == null) return null;
  if (rating <= 2.0) return 0.65;
  if (rating <= 2.5) return 0.5;
  if (rating <= 3.0) return 0.35;
  if (rating <= 3.5) return 0.2;
  if (rating <= 4.0) return 0.12;
  return 0.06;
}

function extractComplaintThemes(summary: string | null): string[] {
  if (!summary) return [];
  const s = summary.toLowerCase();
  const themes: string[] = [];
  if (/\brefund|return|chargeback|money back\b/.test(s)) themes.push("refund/returns");
  if (/\bshipping|delivery|late|delay|arrived\b/.test(s)) themes.push("shipping delays");
  if (/\bquality|damaged|not as described|cheap\b/.test(s)) themes.push("product quality");
  if (/\bscam|fraud|fake|misleading\b/.test(s)) themes.push("scam/misleading claims");
  return themes;
}

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
  const baseFallback: ReviewSignals = {
    googleFound: false,
    ...emptyTrustpilot,
    suspiciousReviewSignals: ["No public review signals found"],
    sources: [],
    warnings: []
  };

  let googleResult: ReviewSignals = baseFallback;
  if (!apiKey) {
    googleResult.warnings.push("GOOGLE_MAPS_API_KEY is not configured.");
  } else if (!canConsumeGoogleReviewCall()) {
    googleResult.warnings.push("Google review lookup skipped due to daily API limit.");
  } else {
    recordGoogleReviewCall();
    const { result } = await fetchGooglePlacesReviewSignals(normalizedDomain, apiKey);
    googleResult = result;
  }

  let outscraperBlock: ReviewSignals["outscraper"] | undefined;
  try {
    const enrichment = await getReputationEnrichment({
      domain: normalizedDomain,
      baseRiskScore: 55,
      deepScan: false
    });
    if (enrichment.source === "outscraper" || enrichment.source === "cache") {
      const rating = enrichment.googleRating ?? null;
      const count = enrichment.googleReviewCount ?? null;
      const themes = extractComplaintThemes(enrichment.sentimentSummary);
      const negativeRatio = inferNegativeRatio(rating);
      const confidence: "low" | "medium" | "high" =
        typeof count === "number" && count >= 150
          ? "high"
          : typeof count === "number" && count >= 40
            ? "medium"
            : "low";
      const identityMismatch = enrichment.businessNameMatch === false;

      outscraperBlock = {
        source: "Outscraper Google Reviews",
        available: true,
        rating,
        reviewCount: count,
        negativeReviewRatio: negativeRatio,
        strongestComplaintThemes: themes,
        confidence,
        negativeTrend: Boolean(enrichment.latestReviewDate && (Date.now() - new Date(enrichment.latestReviewDate).getTime()) < 1000 * 60 * 60 * 24 * 120 && (negativeRatio ?? 0) >= 0.2),
        suspiciousPositivePattern: Boolean(enrichment.reviewSpikeSuspected),
        businessIdentityMismatch: identityMismatch,
        businessAddress: null,
        businessPhone: null,
        businessCategory: null,
        websiteMatch: identityMismatch ? false : null
      };

      googleResult.sources = [...new Set([...googleResult.sources, "Outscraper Google Reviews"])];
      if ((negativeRatio ?? 0) >= 0.3) {
        googleResult.suspiciousReviewSignals.push("High complaint volume in Outscraper Google Reviews profile");
      }
      if (outscraperBlock.negativeTrend) {
        googleResult.suspiciousReviewSignals.push("Recent negative review trend detected in Outscraper profile");
      }
      if (outscraperBlock.suspiciousPositivePattern) {
        googleResult.suspiciousReviewSignals.push("Suspicious positive-review spike pattern in Outscraper profile");
      }
      if (themes.includes("refund/returns") || themes.includes("shipping delays")) {
        googleResult.suspiciousReviewSignals.push("Outscraper themes include refund/shipping complaints");
      }
      if (identityMismatch) {
        googleResult.suspiciousReviewSignals.push("Outscraper business identity mismatch with domain");
      }
      if (!googleResult.googleFound && rating != null && count != null) {
        googleResult.googleFound = true;
        googleResult.googleRating = rating;
        googleResult.googleReviewCount = count;
      }
    } else {
      outscraperBlock = {
        source: "Outscraper Google Reviews",
        available: false,
        rating: null,
        reviewCount: null,
        negativeReviewRatio: null,
        strongestComplaintThemes: [],
        confidence: "low",
        negativeTrend: false,
        suspiciousPositivePattern: false,
        businessIdentityMismatch: false,
        businessAddress: null,
        businessPhone: null,
        businessCategory: null,
        websiteMatch: null
      };
      googleResult.warnings.push(enrichment.message ?? "Outscraper review data unavailable.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    outscraperBlock = {
      source: "Outscraper Google Reviews",
      available: false,
      rating: null,
      reviewCount: null,
      negativeReviewRatio: null,
      strongestComplaintThemes: [],
      confidence: "low",
      negativeTrend: false,
      suspiciousPositivePattern: false,
      businessIdentityMismatch: false,
      businessAddress: null,
      businessPhone: null,
      businessCategory: null,
      websiteMatch: null
    };
    googleResult.warnings.push(`Outscraper review lookup failed: ${message}`);
  }

  const mergedResult: ReviewSignals = {
    ...googleResult,
    suspiciousReviewSignals: [...new Set(googleResult.suspiciousReviewSignals)],
    sources: [...new Set(googleResult.sources)],
    warnings: [...new Set(googleResult.warnings)],
    outscraper: outscraperBlock
  };
  setCached(cacheKey, mergedResult, REVIEWS_CACHE_TTL_MS);
  return mergedResult;
}
