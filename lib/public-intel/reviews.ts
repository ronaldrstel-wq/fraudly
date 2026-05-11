import { load } from "cheerio";
import { normalizeDomain } from "@/lib/cache";
import { buildBrandQueryCandidates } from "@/lib/public-intel/brandCandidates";
import { enforceRateLimit, fetchWithTimeout, withCache, type PublicIntelResult } from "@/lib/public-intel/shared";

export type PublicReviewIntel = {
  indexedSnippets: number;
  possibleRating: number | null;
  possibleReviewCount: number | null;
  matchedQuery?: string | null;
};

const SOURCE = "Google indexed snippets (public web search)";

export async function collectIndexedReviewSnippets(domain: string): Promise<PublicIntelResult<PublicReviewIntel> & { fromCache: boolean }> {
  const normalized = normalizeDomain(domain);
  return withCache(`public-intel:reviews:${normalized}`, async () => {
    try {
      enforceRateLimit("google-indexed", 1200);
      const candidates = buildBrandQueryCandidates(normalized);
      for (const candidate of candidates) {
        const query = `${candidate} reviews trust score`;
        const response = await fetchWithTimeout(`https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en`);
        if (!response.ok) continue;
        const html = await response.text();
        const $ = load(html);
        const pageText = $("body").text();
        const snippets = $("div").filter((_, el) => ($(el).text() || "").toLowerCase().includes(normalized)).length;
        const ratingMatch = pageText.match(/(\d(?:\.\d)?)\s*(?:\/\s*5|out of 5)/i);
        const countMatch = pageText.match(/([\d,]+)\s+reviews?/i);
        if (!ratingMatch && !countMatch && snippets === 0) continue;
        return {
          ok: true,
          source: SOURCE,
          data: {
            indexedSnippets: snippets,
            possibleRating: ratingMatch ? Number(ratingMatch[1]) : null,
            possibleReviewCount: countMatch ? Number(countMatch[1].replaceAll(",", "")) : null,
            matchedQuery: candidate
          }
        };
      }
      return {
        ok: false,
        source: SOURCE,
        data: null,
        warning: "No indexed review snippets matched domain or brand candidates."
      };
    } catch (error) {
      return { ok: false, source: SOURCE, data: null, warning: error instanceof Error ? error.message : "Indexed snippets fetch failed" };
    }
  });
}
