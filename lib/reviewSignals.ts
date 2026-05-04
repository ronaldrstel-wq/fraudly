const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const PLACES_TIMEOUT_MS = 6000;

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

/**
 * Fetches public Google Places signals for a hostname (server-side only).
 *
 * TODO: Replace Trustpilot mock path with official Trustpilot API integration.
 */
export async function getReviewSignals(domain: string): Promise<ReviewSignals> {
  const emptyTrustpilot = {
    trustpilotFound: false as const,
    trustpilotRating: undefined,
    trustpilotReviewCount: undefined
  };

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
      body: JSON.stringify({ textQuery: domain })
    });

    const rawBody = await response.text();
    if (!response.ok) {
      return {
        googleFound: false,
        ...emptyTrustpilot,
        suspiciousReviewSignals: ["No public review signals found"],
        sources: ["Google Places API (searchText)"],
        warnings: [`Google Places request failed (${response.status}). ${rawBody.slice(0, 200)}`]
      };
    }

    let data: PlacesSearchResponse;
    try {
      data = JSON.parse(rawBody) as PlacesSearchResponse;
    } catch {
      return {
        googleFound: false,
        ...emptyTrustpilot,
        suspiciousReviewSignals: ["No public review signals found"],
        sources: ["Google Places API (searchText)"],
        warnings: ["Google Places response was not valid JSON."]
      };
    }

    const places = data.places ?? [];
    for (const place of places) {
      const websiteUri = place.websiteUri;
      if (!websiteUri || !websiteHostMatchesCheckedDomain(websiteUri, domain)) continue;

      const rating = typeof place.rating === "number" ? place.rating : undefined;
      const count = typeof place.userRatingCount === "number" ? place.userRatingCount : undefined;
      if (rating == null || count == null) continue;

      return {
        googleFound: true,
        googleRating: rating,
        googleReviewCount: count,
        ...emptyTrustpilot,
        suspiciousReviewSignals: [],
        sources: ["Google Places API (searchText)"],
        warnings: []
      };
    }

    return {
      googleFound: false,
      ...emptyTrustpilot,
      suspiciousReviewSignals: ["No public review signals found"],
      sources: ["Google Places API (searchText)"],
      warnings: ["No Google Places result matched this domain's website."]
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      googleFound: false,
      ...emptyTrustpilot,
      suspiciousReviewSignals: ["No public review signals found"],
      sources: ["Google Places API (searchText)"],
      warnings: [`Google Places lookup failed: ${message}`]
    };
  } finally {
    clearTimeout(timeout);
  }
}
