export type OutscraperReviewSignals = {
  googleRating: number | null;
  googleReviewCount: number | null;
  trustpilotRating: number | null;
  trustpilotReviewCount: number | null;
  ok: boolean;
  httpStatusGoogle: number | null;
  httpStatusTrustpilot: number | null;
  error: string | null;
};

const OUTSCRAPER_BASE = "https://api.outscraper.com";
const REQUEST_TIMEOUT_MS = 28_000;

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number.parseFloat(value.replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function firstRecord(payload: unknown): Record<string, unknown> | null {
  if (!payload) return null;
  if (Array.isArray(payload)) {
    for (const row of payload) {
      const rec = firstRecord(row);
      if (rec) return rec;
    }
    return null;
  }
  if (typeof payload === "object") return payload as Record<string, unknown>;
  return null;
}

function pickRatingAndCount(row: Record<string, unknown>): { rating: number | null; reviewCount: number | null } {
  const rating =
    parseNumber(row.rating) ??
    parseNumber(row.review_rating) ??
    parseNumber(row.reviews_rating) ??
    parseNumber(row.stars) ??
    parseNumber(row.average_rating);
  const reviewCount =
    parseNumber(row.reviews) ??
    parseNumber(row.reviews_count) ??
    parseNumber(row.review_count) ??
    parseNumber(row.total_reviews) ??
    parseNumber(row.user_ratings_total);
  return { rating, reviewCount };
}

async function outscraperFetch(path: string, params: Record<string, string>): Promise<Response> {
  const apiKey = process.env.OUTSCRAPER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OUTSCRAPER_API_KEY missing");
  }
  const url = new URL(path.startsWith("/") ? path : `/${path}`, OUTSCRAPER_BASE);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return fetch(url.toString(), {
    method: "GET",
    headers: {
      "X-API-KEY": apiKey,
      Accept: "application/json"
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });
}

async function fetchGoogleMapsAggregate(domain: string): Promise<{ rating: number | null; reviewCount: number | null; httpStatus: number }> {
  const response = await outscraperFetch("/google-maps-reviews", {
    query: domain,
    reviewsLimit: "0",
    limit: "1",
    language: "en"
  });
  const httpStatus = response.status;
  if (!response.ok) {
    return { rating: null, reviewCount: null, httpStatus };
  }
  const json = (await response.json()) as unknown;
  const row = firstRecord(json);
  if (!row) return { rating: null, reviewCount: null, httpStatus };
  const picked = pickRatingAndCount(row);
  return { ...picked, httpStatus };
}

async function fetchTrustpilotAggregate(domain: string): Promise<{ rating: number | null; reviewCount: number | null; httpStatus: number }> {
  const response = await outscraperFetch("/trustpilot/reviews", {
    query: domain,
    reviewsLimit: "0",
    limit: "1"
  });
  const httpStatus = response.status;
  if (!response.ok) {
    return { rating: null, reviewCount: null, httpStatus };
  }
  const json = (await response.json()) as unknown;
  const row = firstRecord(json);
  if (!row) return { rating: null, reviewCount: null, httpStatus };
  const picked = pickRatingAndCount(row);
  return { ...picked, httpStatus };
}

/** Calls Outscraper paid review endpoints (aggregate rating + count, no per-review pull). */
export async function fetchOutscraperReviewSignals(domain: string): Promise<OutscraperReviewSignals> {
  const [googleSettled, trustpilotSettled] = await Promise.allSettled([
    fetchGoogleMapsAggregate(domain),
    fetchTrustpilotAggregate(domain)
  ]);

  const google =
    googleSettled.status === "fulfilled"
      ? googleSettled.value
      : { rating: null, reviewCount: null, httpStatus: 0 };
  const trustpilot =
    trustpilotSettled.status === "fulfilled"
      ? trustpilotSettled.value
      : { rating: null, reviewCount: null, httpStatus: 0 };

  const errors: string[] = [];
  if (googleSettled.status === "rejected") {
    errors.push(`google: ${googleSettled.reason instanceof Error ? googleSettled.reason.message : String(googleSettled.reason)}`);
  }
  if (trustpilotSettled.status === "rejected") {
    errors.push(
      `trustpilot: ${trustpilotSettled.reason instanceof Error ? trustpilotSettled.reason.message : String(trustpilotSettled.reason)}`
    );
  }

  const ok =
    (google.rating != null && google.reviewCount != null) ||
    (trustpilot.rating != null || trustpilot.reviewCount != null);

  return {
    googleRating: google.rating,
    googleReviewCount: google.reviewCount,
    trustpilotRating: trustpilot.rating,
    trustpilotReviewCount: trustpilot.reviewCount,
    ok,
    httpStatusGoogle: google.httpStatus || null,
    httpStatusTrustpilot: trustpilot.httpStatus || null,
    error: errors.length > 0 ? errors.join("; ") : null
  };
}
