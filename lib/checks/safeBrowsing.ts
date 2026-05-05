import type { SafeBrowsingCheck } from "@/lib/checks/types";
import { fetchJsonWithTimeout, fromCache, isEnabled, toCache } from "@/lib/checks/utils";

const SOURCE = "Google Safe Browsing";
const CACHE_TTL_MS = 2 * 60 * 60 * 1000;
const TIMEOUT_MS = 5000;

type SafeBrowsingResponse = {
  matches?: Array<{ threatType?: string }>;
};

export async function runSafeBrowsingCheck(url: string): Promise<SafeBrowsingCheck> {
  if (!isEnabled("ENABLE_SAFE_BROWSING", true)) {
    return {
      safeBrowsingStatus: "unknown",
      safeBrowsingThreats: [],
      source: SOURCE,
      warnings: ["Safe Browsing disabled by configuration."]
    };
  }

  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY?.trim();
  if (!apiKey) {
    return {
      safeBrowsingStatus: "unknown",
      safeBrowsingThreats: [],
      source: SOURCE,
      warnings: ["GOOGLE_SAFE_BROWSING_API_KEY missing."]
    };
  }

  const cacheKey = `checks:safebrowsing:${url}`;
  const cached = fromCache<SafeBrowsingCheck>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchJsonWithTimeout<SafeBrowsingResponse>(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      TIMEOUT_MS,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { clientId: "fraudly", clientVersion: "1.0.0" },
          threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }]
          }
        })
      }
    );
    const threats = [...new Set((response.matches ?? []).map((match) => match.threatType).filter((t): t is string => Boolean(t)))];
    const result: SafeBrowsingCheck = {
      safeBrowsingStatus: threats.length > 0 ? "flagged" : "safe",
      safeBrowsingThreats: threats,
      source: SOURCE,
      warnings: []
    };
    toCache(cacheKey, result, CACHE_TTL_MS);
    return result;
  } catch (error) {
    return {
      safeBrowsingStatus: "unknown",
      safeBrowsingThreats: [],
      source: SOURCE,
      warnings: [error instanceof Error ? error.message : "Safe Browsing unavailable"]
    };
  }
}
