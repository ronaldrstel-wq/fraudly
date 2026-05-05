import { normalizeDomain } from "@/lib/cache";
import type { FeedThreatCheck } from "@/lib/checks/types";
import { fetchJsonWithTimeout, fromCache, isEnabled, toCache } from "@/lib/checks/utils";

const SOURCE = "URLHaus";
const CACHE_TTL_MS = 60 * 60 * 1000;
const TIMEOUT_MS = 5000;

type UrlHausHostResponse = {
  query_status?: string;
  urls?: Array<{ url?: string }>;
};

export async function runUrlHausCheck(domain: string): Promise<FeedThreatCheck> {
  if (!isEnabled("ENABLE_URLHAUS_CHECK", true)) {
    return { listed: false, matches: [], source: SOURCE, warnings: ["URLHaus disabled by configuration."] };
  }

  const normalizedDomain = normalizeDomain(domain);
  const cacheKey = `checks:urlhaus:${normalizedDomain}`;
  const cached = fromCache<FeedThreatCheck>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchJsonWithTimeout<UrlHausHostResponse>("https://urlhaus-api.abuse.ch/v1/host/", TIMEOUT_MS, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ host: normalizedDomain }).toString()
    });
    const urls = (response.urls ?? []).map((entry) => entry.url).filter((url): url is string => Boolean(url));
    const result: FeedThreatCheck = {
      listed: response.query_status === "ok" && urls.length > 0,
      matches: urls.slice(0, 5),
      source: SOURCE,
      warnings: response.query_status && response.query_status !== "ok" ? [`URLHaus status: ${response.query_status}`] : []
    };
    toCache(cacheKey, result, CACHE_TTL_MS);
    return result;
  } catch (error) {
    return {
      listed: false,
      matches: [],
      source: SOURCE,
      warnings: [error instanceof Error ? error.message : "URLHaus unavailable"]
    };
  }
}
