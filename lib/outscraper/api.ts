import { extractCompanyIdentity, type CompanyIdentity } from "@/lib/reputation/companyIdentity";
import {
  logGoogleMatchDebug,
  validateGoogleBusinessMatch,
  googleValidationAffectsTrustScore,
  googleValidationIsDisplayable,
  type GoogleBusinessCandidate,
  type GoogleMatchConfidence,
  type GoogleMatchValidation
} from "@/lib/reputation/googleMatch";
import { MAX_TRUSTPILOT_OUTSCRAPER_ATTEMPTS } from "@/lib/reputation/reviewConfig";
import {
  validateTrustpilotMatch,
  trustpilotValidationIsDisplayable,
  type TrustpilotCandidate,
  type TrustpilotValidation
} from "@/lib/reputation/trustpilotMatch";

export type TrustpilotLookupMode = "domain" | "url" | "company-name" | "country-brand" | "none";

export type TrustpilotLookupMeta = {
  provider: "outscraper";
  lookupMode: TrustpilotLookupMode | "none";
  queryUsed: string | null;
  confidence: TrustpilotValidation["confidence"];
  attemptedQueries: string[];
  attemptedQueriesCount: number;
  matchedDomain?: string | null;
  matchedCompanyName?: string | null;
  profileUrl?: string | null;
  validationReasons?: string[];
  httpStatus: number | null;
  errorType?: string | null;
};

export type GoogleLookupMeta = {
  provider: "outscraper";
  queryUsed: string | null;
  confidence: GoogleMatchConfidence;
  confidenceScore: number;
  exactDomainMatch: boolean;
  matchedDomain?: string | null;
  matchedBusinessName?: string | null;
  googleWebsite?: string | null;
  validationReasons?: string[];
  httpStatus: number | null;
  errorType?: string | null;
};

export type OutscraperReviewSignals = {
  googleRating: number | null;
  googleReviewCount: number | null;
  googleLookup: GoogleLookupMeta;
  trustpilotRating: number | null;
  trustpilotReviewCount: number | null;
  trustpilotLookup: TrustpilotLookupMeta;
  ok: boolean;
  httpStatusGoogle: number | null;
  httpStatusTrustpilot: number | null;
  error: string | null;
};

export type FetchOutscraperInput = {
  domain: string;
  registrableDomain?: string;
  html?: string | null;
  companyIdentity?: CompanyIdentity | null;
  countryHint?: string | null;
  maxTrustpilotAttempts?: number;
};

const OUTSCRAPER_BASE = "https://api.outscraper.com";
const REQUEST_TIMEOUT_MS = 28_000;

const COUNTRY_TLD_HINTS: Record<string, string> = {
  nl: "Netherlands",
  be: "Belgium",
  de: "Germany",
  fr: "France",
  uk: "United Kingdom",
  gb: "United Kingdom",
  ie: "Ireland",
  es: "Spain",
  it: "Italy",
  at: "Austria",
  ch: "Switzerland",
  se: "Sweden",
  no: "Norway",
  dk: "Denmark",
  pl: "Poland",
  pt: "Portugal",
  us: "United States",
  ca: "Canada",
  au: "Australia"
};

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

function pickString(row: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function parseGoogleBusinessCandidate(row: Record<string, unknown>): GoogleBusinessCandidate {
  const picked = pickRatingAndCount(row);
  return {
    rating: picked.rating,
    reviewCount: picked.reviewCount,
    businessName:
      pickString(row, ["name", "business_name", "title", "place_name", "display_name"]) ?? null,
    website: pickString(row, ["site", "website", "company_website", "domain", "url"]) ?? null,
    placeId: pickString(row, ["place_id", "google_id"]) ?? null
  };
}

function hasGoogleAggregateData(candidate: GoogleBusinessCandidate): boolean {
  return candidate.rating != null || candidate.reviewCount != null;
}

function parseTrustpilotCandidate(row: Record<string, unknown>): TrustpilotCandidate {
  const picked = pickRatingAndCount(row);
  return {
    rating: picked.rating,
    reviewCount: picked.reviewCount,
    companyName:
      pickString(row, ["name", "business_name", "company_name", "title", "brand_name", "display_name"]) ?? null,
    website: pickString(row, ["website", "domain", "company_website", "site", "url"]) ?? null,
    profileUrl: pickString(row, ["link", "profile_url", "trustpilot_url", "company_url", "source_url"]) ?? null,
    rawDomain: pickString(row, ["domain", "website"]) ?? null
  };
}

function hasAggregateData(candidate: TrustpilotCandidate): boolean {
  return candidate.rating != null || candidate.reviewCount != null;
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

function collectGoogleRows(payload: unknown): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  const walk = (node: unknown): void => {
    if (!node) return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (typeof node === "object") {
      const rec = node as Record<string, unknown>;
      if (hasGoogleAggregateData(parseGoogleBusinessCandidate(rec))) {
        rows.push(rec);
      }
      for (const value of Object.values(rec)) {
        if (Array.isArray(value)) walk(value);
      }
    }
  };
  walk(payload);
  return rows;
}

async function fetchGoogleMapsCandidates(
  query: string,
  limit: number
): Promise<{ candidates: GoogleBusinessCandidate[]; httpStatus: number; errorType: string | null }> {
  const response = await outscraperFetch("/google-maps-reviews", {
    query,
    reviewsLimit: "0",
    limit: String(Math.max(1, limit)),
    language: "en"
  });
  const httpStatus = response.status;
  if (!httpStatus || httpStatus >= 400) {
    return {
      candidates: [],
      httpStatus,
      errorType: httpStatus === 429 ? "rate_limited" : "http_error"
    };
  }
  try {
    const json = (await response.json()) as unknown;
    const rows = collectGoogleRows(json);
    const candidates = rows
      .map((row) => ({ ...parseGoogleBusinessCandidate(row), queryUsed: query }))
      .filter(hasGoogleAggregateData);
    return { candidates, httpStatus, errorType: candidates.length === 0 ? "no_match" : null };
  } catch {
    return { candidates: [], httpStatus, errorType: "parse_error" };
  }
}

function pickBestGoogleValidation(args: {
  candidates: GoogleBusinessCandidate[];
  registrableDomain: string;
  companyIdentity: CompanyIdentity;
}): { validation: GoogleMatchValidation; candidate: GoogleBusinessCandidate | null } {
  let best: { validation: GoogleMatchValidation; candidate: GoogleBusinessCandidate } | null = null;

  for (const candidate of args.candidates) {
    const validation = validateGoogleBusinessMatch(candidate, args.registrableDomain, args.companyIdentity);
    if (googleValidationIsDisplayable(validation)) {
      return { validation, candidate };
    }
    if (!best || validation.score > best.validation.score) {
      best = { validation, candidate };
    }
  }

  if (best) return best;
  return {
    validation: {
      accepted: false,
      confidence: "none",
      score: 0,
      exactDomainMatch: false,
      reasons: ["no_google_candidates"]
    },
    candidate: null
  };
}

async function fetchGoogleWithValidation(args: {
  domain: string;
  registrableDomain: string;
  companyIdentity: CompanyIdentity;
}): Promise<{
  rating: number | null;
  reviewCount: number | null;
  meta: GoogleLookupMeta;
}> {
  const queries = [args.registrableDomain, `https://${args.registrableDomain}`];
  const seen = new Set<string>();
  let lastHttpStatus: number | null = null;
  let lastErrorType: string | null = null;
  let bestOverall: { validation: GoogleMatchValidation; candidate: GoogleBusinessCandidate | null } | null =
    null;

  for (const query of queries) {
    const key = query.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);

    const fetched = await fetchGoogleMapsCandidates(query, 3);
    lastHttpStatus = fetched.httpStatus;
    lastErrorType = fetched.errorType;
    const picked = pickBestGoogleValidation({
      candidates: fetched.candidates,
      registrableDomain: args.registrableDomain,
      companyIdentity: args.companyIdentity
    });
    if (googleValidationIsDisplayable(picked.validation)) {
      bestOverall = picked;
      break;
    }
    if (
      !bestOverall ||
      picked.validation.score > bestOverall.validation.score
    ) {
      bestOverall = picked;
    }
  }

  const validation = bestOverall?.validation ?? {
    accepted: false,
    confidence: "none" as const,
    score: 0,
    exactDomainMatch: false,
    reasons: ["no_validated_google_match"]
  };
  const candidate = bestOverall?.candidate ?? null;
  const useInTrustScore = googleValidationAffectsTrustScore(validation);
  const displayable = googleValidationIsDisplayable(validation);

  logGoogleMatchDebug({
    domain: args.registrableDomain,
    businessName: validation.matchedBusinessName ?? candidate?.businessName ?? null,
    googleWebsite: validation.googleWebsite ?? candidate?.website ?? null,
    confidence: validation.confidence,
    confidenceScore: validation.score,
    exactDomainMatch: validation.exactDomainMatch,
    usedInTrustScore: useInTrustScore,
    reasons: validation.reasons
  });

  return {
    rating: displayable ? candidate?.rating ?? null : null,
    reviewCount: displayable ? candidate?.reviewCount ?? null : null,
    meta: {
      provider: "outscraper",
      queryUsed: candidate?.queryUsed ?? queries[0] ?? null,
      confidence: validation.confidence,
      confidenceScore: validation.score,
      exactDomainMatch: validation.exactDomainMatch,
      matchedDomain: validation.matchedDomain ?? null,
      matchedBusinessName: validation.matchedBusinessName ?? null,
      googleWebsite: validation.googleWebsite ?? null,
      validationReasons: validation.reasons,
      httpStatus: lastHttpStatus,
      errorType: lastErrorType
    }
  };
}

async function fetchTrustpilotQuery(
  query: string
): Promise<{ candidate: TrustpilotCandidate | null; httpStatus: number; errorType: string | null }> {
  const response = await outscraperFetch("/trustpilot/reviews", {
    query,
    reviewsLimit: "0",
    limit: "1"
  });
  const httpStatus = response.status;
  if (!httpStatus || httpStatus >= 400) {
    return {
      candidate: null,
      httpStatus,
      errorType: httpStatus === 429 ? "rate_limited" : "http_error"
    };
  }
  try {
    const json = (await response.json()) as unknown;
    const row = firstRecord(json);
    if (!row) return { candidate: null, httpStatus, errorType: "empty_payload" };
    const candidate = parseTrustpilotCandidate(row);
    if (!hasAggregateData(candidate)) {
      return { candidate: null, httpStatus, errorType: "no_match" };
    }
    return { candidate, httpStatus, errorType: null };
  } catch {
    return { candidate: null, httpStatus, errorType: "parse_error" };
  }
}

function countryHintFromDomain(domain: string): string | null {
  const tld = domain.split(".").pop()?.toLowerCase();
  if (!tld) return null;
  return COUNTRY_TLD_HINTS[tld] ?? null;
}

function buildTrustpilotQueries(input: {
  domain: string;
  registrableDomain: string;
  companyIdentity: CompanyIdentity;
  countryHint?: string | null;
}): Array<{ mode: TrustpilotLookupMode; query: string }> {
  const queries: Array<{ mode: TrustpilotLookupMode; query: string }> = [
    { mode: "domain", query: input.registrableDomain },
    { mode: "url", query: `https://${input.registrableDomain}` }
  ];

  for (const name of input.companyIdentity.candidates) {
    queries.push({ mode: "company-name", query: name });
  }

  const country = input.countryHint ?? countryHintFromDomain(input.registrableDomain);
  if (country && input.companyIdentity.primaryName) {
    queries.push({
      mode: "country-brand",
      query: `${input.companyIdentity.primaryName} ${country}`
    });
  }

  const seen = new Set<string>();
  return queries.filter((row) => {
    const key = row.query.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchTrustpilotWithFallback(args: {
  domain: string;
  registrableDomain: string;
  companyIdentity: CompanyIdentity;
  countryHint?: string | null;
  maxAttempts: number;
}): Promise<{
  rating: number | null;
  reviewCount: number | null;
  meta: TrustpilotLookupMeta;
}> {
  const attemptedQueries: string[] = [];
  const queries = buildTrustpilotQueries(args).slice(0, args.maxAttempts);

  let best:
    | {
        validation: TrustpilotValidation;
        candidate: TrustpilotCandidate;
        mode: TrustpilotLookupMode;
        query: string;
      }
    | null = null;
  let lastHttpStatus: number | null = null;
  let lastErrorType: string | null = null;

  for (const item of queries) {
    if (attemptedQueries.length >= args.maxAttempts) break;
    attemptedQueries.push(item.query);
    const result = await fetchTrustpilotQuery(item.query);
    lastHttpStatus = result.httpStatus;
    lastErrorType = result.errorType;
    if (!result.candidate) continue;

    const validation = validateTrustpilotMatch(result.candidate, args.registrableDomain, args.companyIdentity);
    if (!trustpilotValidationIsDisplayable(validation.confidence)) continue;

    if (validation.confidence === "high") {
      return {
        rating: result.candidate.rating,
        reviewCount: result.candidate.reviewCount,
        meta: {
          provider: "outscraper",
          lookupMode: item.mode,
          queryUsed: item.query,
          confidence: validation.confidence,
          attemptedQueries,
          attemptedQueriesCount: attemptedQueries.length,
          matchedDomain: validation.matchedDomain ?? null,
          matchedCompanyName: validation.matchedCompanyName ?? null,
          profileUrl: validation.profileUrl ?? null,
          validationReasons: validation.reasons,
          httpStatus: result.httpStatus,
          errorType: null
        }
      };
    }

    if (!best || validation.score > best.validation.score) {
      best = { validation, candidate: result.candidate, mode: item.mode, query: item.query };
    }
  }

  if (best) {
    return {
      rating: best.candidate.rating,
      reviewCount: best.candidate.reviewCount,
      meta: {
        provider: "outscraper",
        lookupMode: best.mode,
        queryUsed: best.query,
        confidence: best.validation.confidence,
        attemptedQueries,
        attemptedQueriesCount: attemptedQueries.length,
        matchedDomain: best.validation.matchedDomain ?? null,
        matchedCompanyName: best.validation.matchedCompanyName ?? null,
        profileUrl: best.validation.profileUrl ?? null,
        validationReasons: best.validation.reasons,
        httpStatus: lastHttpStatus,
        errorType: null
      }
    };
  }

  return {
    rating: null,
    reviewCount: null,
    meta: {
      provider: "outscraper",
      lookupMode: "none",
      queryUsed: attemptedQueries[attemptedQueries.length - 1] ?? null,
      confidence: "none",
      attemptedQueries,
      attemptedQueriesCount: attemptedQueries.length,
      matchedDomain: null,
      matchedCompanyName: null,
      profileUrl: null,
      validationReasons: ["no_validated_trustpilot_match"],
      httpStatus: lastHttpStatus,
      errorType: lastErrorType
    }
  };
}

/** Calls Outscraper paid review endpoints with Trustpilot multi-query fallback. */
export async function fetchOutscraperReviewSignals(input: FetchOutscraperInput): Promise<OutscraperReviewSignals> {
  const registrableDomain = input.registrableDomain ?? input.domain;
  const companyIdentity = input.companyIdentity ?? extractCompanyIdentity(input.html, registrableDomain);
  const maxAttempts = input.maxTrustpilotAttempts ?? MAX_TRUSTPILOT_OUTSCRAPER_ATTEMPTS;

  const errors: string[] = [];
  let google: {
    rating: number | null;
    reviewCount: number | null;
    meta: GoogleLookupMeta;
  } = {
    rating: null,
    reviewCount: null,
    meta: {
      provider: "outscraper",
      queryUsed: null,
      confidence: "none",
      confidenceScore: 0,
      exactDomainMatch: false,
      httpStatus: null,
      errorType: null
    }
  };
  let trustpilot: {
    rating: number | null;
    reviewCount: number | null;
    meta: TrustpilotLookupMeta;
  } = {
    rating: null,
    reviewCount: null,
    meta: {
      provider: "outscraper",
      lookupMode: "none",
      queryUsed: null,
      confidence: "none",
      attemptedQueries: [],
      attemptedQueriesCount: 0,
      httpStatus: null,
      errorType: null
    }
  };

  try {
    google = await fetchGoogleWithValidation({
      domain: input.domain,
      registrableDomain,
      companyIdentity
    });
  } catch (error) {
    errors.push(`google: ${error instanceof Error ? error.message : String(error)}`);
    google.meta.errorType = "provider_error";
  }

  try {
    const tp = await fetchTrustpilotWithFallback({
      domain: input.domain,
      registrableDomain,
      companyIdentity,
      countryHint: input.countryHint,
      maxAttempts
    });
    trustpilot = { rating: tp.rating, reviewCount: tp.reviewCount, meta: tp.meta };
  } catch (error) {
    errors.push(`trustpilot: ${error instanceof Error ? error.message : String(error)}`);
    trustpilot.meta.errorType = "provider_error";
  }

  const googleOk =
    google.meta.confidence === "high" &&
    google.meta.exactDomainMatch &&
    (google.rating != null || google.reviewCount != null);
  const trustpilotOk =
    trustpilot.meta.confidence === "high" || trustpilot.meta.confidence === "medium"
      ? trustpilot.rating != null || trustpilot.reviewCount != null
      : false;

  return {
    googleRating: googleOk ? google.rating : null,
    googleReviewCount: googleOk ? google.reviewCount : null,
    googleLookup: google.meta,
    trustpilotRating: trustpilotOk ? trustpilot.rating : null,
    trustpilotReviewCount: trustpilotOk ? trustpilot.reviewCount : null,
    trustpilotLookup: trustpilot.meta,
    ok: googleOk || trustpilotOk,
    httpStatusGoogle: google.meta.httpStatus,
    httpStatusTrustpilot: trustpilot.meta.httpStatus,
    error: errors.length > 0 ? errors.join("; ") : null
  };
}
