import { load } from "cheerio";
import { normalizeDomain } from "@/lib/cache";
import { buildBrandQueryCandidates } from "@/lib/public-intel/brandCandidates";
import { enforceRateLimit, fetchWithTimeout, isPathAllowedByRobots, withCache, type PublicIntelResult } from "@/lib/public-intel/shared";

export type TrustpilotIntel = {
  rating: number | null;
  reviewCount: number | null;
  claimed: boolean | null;
  freshestReviewDays: number | null;
  businessName: string | null;
  matchedQuery?: string | null;
  matchedProfilePath?: string | null;
};

const SOURCE = "Trustpilot (public page)";

function parseTrustpilot(html: string): TrustpilotIntel {
  const $ = load(html);
  const body = $("body").text();
  const ratingMatch = body.match(/(\d(?:\.\d)?)\s*out of 5/i);
  const reviewCountMatch = body.match(/([\d,]+)\s+reviews?/i);
  const claimed = /\bclaimed profile\b/i.test(body) ? true : /\bunclaimed\b/i.test(body) ? false : null;
  const freshest = body.match(/(\d+)\s+(day|days|month|months)\s+ago/i);
  const freshestDays = freshest
    ? Number(freshest[2].startsWith("month") ? Number(freshest[1]) * 30 : Number(freshest[1]))
    : null;
  const businessName = $('h1 span[itemprop="name"]').first().text().trim() || $("h1").first().text().trim() || null;
  return {
    rating: ratingMatch ? Number(ratingMatch[1]) : null,
    reviewCount: reviewCountMatch ? Number(reviewCountMatch[1].replaceAll(",", "")) : null,
    claimed,
    freshestReviewDays: Number.isFinite(freshestDays ?? NaN) ? freshestDays : null,
    businessName,
    matchedQuery: null,
    matchedProfilePath: null
  };
}

function hasReviewData(data: TrustpilotIntel): boolean {
  return data.rating != null || data.reviewCount != null;
}

async function fetchReviewPath(origin: string, path: string): Promise<PublicIntelResult<TrustpilotIntel> | null> {
  const allowed = await isPathAllowedByRobots(origin, path);
  if (!allowed) return { ok: false, source: SOURCE, data: null, warning: "Blocked by robots policy." };
  const response = await fetchWithTimeout(`${origin}${path}`);
  if (!response.ok) return null;
  const parsed = parseTrustpilot(await response.text());
  return { ok: true, source: SOURCE, data: parsed };
}

function extractReviewPathFromSearch(html: string): string | null {
  const $ = load(html);
  const href = $('a[href^="/review/"]').first().attr("href");
  return href?.trim() || null;
}

export async function collectTrustpilot(domain: string): Promise<PublicIntelResult<TrustpilotIntel> & { fromCache: boolean }> {
  const normalized = normalizeDomain(domain);
  return withCache(`public-intel:trustpilot:${normalized}`, async () => {
    try {
      enforceRateLimit("trustpilot", 800);
      const origin = "https://www.trustpilot.com";
      const path = `/review/${normalized}`;
      const direct = await fetchReviewPath(origin, path);
      if (direct?.ok && direct.data) {
        return { ...direct, data: { ...direct.data, matchedQuery: normalized, matchedProfilePath: path } };
      }

      for (const query of buildBrandQueryCandidates(normalized)) {
        const searchUrl = `${origin}/search?query=${encodeURIComponent(query)}`;
        const searchResponse = await fetchWithTimeout(searchUrl);
        if (!searchResponse.ok) continue;
        const searchHtml = await searchResponse.text();
        const matchedPath = extractReviewPathFromSearch(searchHtml);
        if (!matchedPath) continue;
        const matched = await fetchReviewPath(origin, matchedPath);
        if (!matched?.ok || !matched.data) continue;
        if (!hasReviewData(matched.data)) continue;
        return {
          ok: true,
          source: SOURCE,
          data: {
            ...matched.data,
            matchedQuery: query,
            matchedProfilePath: matchedPath
          }
        };
      }
      return { ok: false, source: SOURCE, data: null, warning: "No Trustpilot profile matched domain or brand candidates." };
    } catch (error) {
      return { ok: false, source: SOURCE, data: null, warning: error instanceof Error ? error.message : "Trustpilot fetch failed" };
    }
  });
}
