import { normalizeDomain } from "@/lib/cache";
import type { FeedThreatCheck } from "@/lib/checks/types";
import { fetchTextWithTimeout, fromCache, isEnabled, toCache } from "@/lib/checks/utils";

const SOURCE = "OpenPhish";
const FEED_URL = "https://openphish.com/feed.txt";
const CACHE_TTL_MS = 60 * 60 * 1000;
const TIMEOUT_MS = 5000;

export async function runOpenPhishCheck(url: string, domain: string): Promise<FeedThreatCheck> {
  if (!isEnabled("ENABLE_OPENPHISH_CHECK", true)) {
    return { listed: false, matches: [], source: SOURCE, warnings: ["OpenPhish disabled by configuration."] };
  }

  const normalizedDomain = normalizeDomain(domain);
  const cacheKey = `checks:openphish:${normalizedDomain}`;
  const cached = fromCache<FeedThreatCheck>(cacheKey);
  if (cached) return cached;

  try {
    const feed = await fetchTextWithTimeout(FEED_URL, TIMEOUT_MS);
    const entries = feed
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 150000);

    const targetUrl = url.toLowerCase();
    const matches = entries.filter((entry) => {
      const lower = entry.toLowerCase();
      return lower === targetUrl || lower.includes(normalizedDomain);
    });

    const result: FeedThreatCheck = {
      listed: matches.length > 0,
      matches: matches.slice(0, 5),
      source: SOURCE,
      warnings: []
    };
    toCache(cacheKey, result, CACHE_TTL_MS);
    return result;
  } catch (error) {
    return {
      listed: false,
      matches: [],
      source: SOURCE,
      warnings: [error instanceof Error ? error.message : "OpenPhish unavailable"]
    };
  }
}
