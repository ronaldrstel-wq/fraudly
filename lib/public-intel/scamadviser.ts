import { load } from "cheerio";
import { normalizeDomain } from "@/lib/cache";
import { enforceRateLimit, fetchWithTimeout, isPathAllowedByRobots, withCache, type PublicIntelResult } from "@/lib/public-intel/shared";

export type ScamAdviserIntel = {
  trustScore: number | null;
};

const SOURCE = "ScamAdviser (public page)";

function parseTrustScore(html: string): number | null {
  const $ = load(html);
  const text = $("body").text();
  const match = text.match(/trust score[^0-9]{0,20}(\d{1,3})/i) ?? text.match(/(\d{1,3})\s*\/\s*100/i);
  if (!match) return null;
  const score = Number(match[1]);
  if (!Number.isFinite(score)) return null;
  return Math.max(0, Math.min(100, score));
}

export async function collectScamAdviser(domain: string): Promise<PublicIntelResult<ScamAdviserIntel> & { fromCache: boolean }> {
  const normalized = normalizeDomain(domain);
  return withCache(`public-intel:scamadviser:${normalized}`, async () => {
    try {
      enforceRateLimit("scamadviser", 1000);
      const origin = "https://www.scamadviser.com";
      const path = `/check-website/${normalized}`;
      const allowed = await isPathAllowedByRobots(origin, path);
      if (!allowed) {
        return { ok: false, source: SOURCE, data: null, warning: "Blocked by robots policy." };
      }
      const response = await fetchWithTimeout(`${origin}${path}`);
      if (!response.ok) {
        return { ok: false, source: SOURCE, data: null, warning: `HTTP ${response.status}` };
      }
      return {
        ok: true,
        source: SOURCE,
        data: { trustScore: parseTrustScore(await response.text()) }
      };
    } catch (error) {
      return { ok: false, source: SOURCE, data: null, warning: error instanceof Error ? error.message : "ScamAdviser fetch failed" };
    }
  });
}
