import { normalizeDomain } from "@/lib/cache";
import type { PoliceScamCheck } from "@/lib/checks/types";
import { fetchTextWithTimeout, fromCache, isEnabled, toCache } from "@/lib/checks/utils";

const SOURCE = "Dutch Police / LMIO";
const CHECK_URL = "https://www.politie.nl/aangifte-of-melding-doen/controleer-handelspartij.html";
const LIST_URL = "https://www.politie.nl/aangifte-of-melding-doen/bekende-malafide-handelspartijen.html";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const TIMEOUT_MS = 4000;

function extractDomainCandidates(text: string): string[] {
  const matches = text.match(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}\b/gi) ?? [];
  return [...new Set(matches.map((m) => normalizeDomain(m)))];
}

export async function runPoliceScamCheck(domain: string): Promise<PoliceScamCheck> {
  if (!isEnabled("ENABLE_POLICE_CHECK", true)) {
    return {
      listedInPoliceScamDatabase: false,
      source: SOURCE,
      warnings: ["Police source disabled by configuration."]
    };
  }

  const normalizedDomain = normalizeDomain(domain);
  const cacheKey = `checks:police:${normalizedDomain}`;
  const cached = fromCache<PoliceScamCheck>(cacheKey);
  if (cached) return cached;

  try {
    const [checkPage, listPage] = await Promise.all([
      fetchTextWithTimeout(CHECK_URL, TIMEOUT_MS),
      fetchTextWithTimeout(LIST_URL, TIMEOUT_MS)
    ]);
    const candidates = [...extractDomainCandidates(checkPage), ...extractDomainCandidates(listPage)];
    const uniqueCandidates = [...new Set(candidates)];
    const match = uniqueCandidates.find((candidate) => candidate === normalizedDomain);

    const result: PoliceScamCheck = match
      ? {
          listedInPoliceScamDatabase: true,
          policeScamMatch: match,
          policeWarningReason: "Domain matched references in public Dutch Police scam pages.",
          source: SOURCE,
          warnings: []
        }
      : {
          listedInPoliceScamDatabase: false,
          source: SOURCE,
          warnings: []
        };

    toCache(cacheKey, result, CACHE_TTL_MS);
    return result;
  } catch (error) {
    return {
      listedInPoliceScamDatabase: false,
      source: SOURCE,
      warnings: [error instanceof Error ? error.message : "Police check unavailable"]
    };
  }
}
