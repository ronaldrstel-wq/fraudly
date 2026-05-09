import { normalizeDomain } from "@/lib/cache";
import { checksConfig } from "@/lib/checks/config";
import type { FeedThreatCheck } from "@/lib/checks/types";
import { fetchTextWithTimeout, fromCache, toCache } from "@/lib/checks/utils";
import type { ProviderRun } from "@/lib/checks/providers/types";
import { wrapEvidence } from "@/lib/checks/providers/shared";

const SOURCE = "OpenPhish";
const FEED_URL = "https://openphish.com/feed.txt";

export async function runOpenPhishProvider(url: string, domain: string): Promise<ProviderRun<FeedThreatCheck>> {
  const timeoutMs = checksConfig.fetchTimeoutMs;
  const ttl = checksConfig.cacheTtlMs.openPhish;
  const normalizedDomain = normalizeDomain(domain);

  if (!checksConfig.openPhish) {
    return {
      evidence: [
        wrapEvidence(
          SOURCE,
          "phishing",
          "info",
          false,
          "OpenPhish disabled",
          "This open feed was turned off in configuration.",
          "high"
        )
      ],
      result: { listed: false, matches: [], source: SOURCE, warnings: ["OpenPhish disabled by configuration."] }
    };
  }

  const cacheKey = `checks:openphish:v2:${normalizedDomain}`;
  const cached = fromCache<{ check: FeedThreatCheck; evidence: ProviderRun<FeedThreatCheck>["evidence"] }>(cacheKey);
  if (cached) return { evidence: cached.evidence, result: cached.check };

  try {
    const feed = await fetchTextWithTimeout(FEED_URL, timeoutMs);
    const entries = feed
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 150_000);

    const targetUrl = url.toLowerCase();
    const matches = entries.filter((entry) => {
      const lower = entry.toLowerCase();
      return lower === targetUrl || lower.includes(normalizedDomain);
    });

    const listed = matches.length > 0;
    const result: FeedThreatCheck = {
      listed,
      matches: matches.slice(0, 5),
      source: SOURCE,
      warnings: []
    };

    const evidence = listed
      ? [
          wrapEvidence(
            SOURCE,
            "phishing",
            "danger",
            true,
            "Listed in OpenPhish public feed",
            "This host or URL appears on the OpenPhish feed used in this check. Treat as a risk indicator aligned with phishing intelligence.",
            "high",
            { sampleMatches: matches.slice(0, 3) }
          )
        ]
      : [
          wrapEvidence(
            SOURCE,
            "phishing",
            "info",
            false,
            "No OpenPhish match found in this snapshot",
            "No overlapping entry was found in the fetched OpenPhish feed for this check window. This does not prove the site is safe.",
            "medium"
          )
        ];

    toCache(cacheKey, { check: result, evidence }, ttl);
    return { evidence, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "OpenPhish unavailable";
    return {
      evidence: [
        wrapEvidence(SOURCE, "phishing", "info", false, "OpenPhish unavailable", message, "low", { error: message })
      ],
      result: { listed: false, matches: [], source: SOURCE, warnings: [message] }
    };
  }
}
