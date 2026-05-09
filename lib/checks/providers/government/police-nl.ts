import { normalizeDomain } from "@/lib/cache";
import { checksConfig } from "@/lib/checks/config";
import type { PoliceScamCheck } from "@/lib/checks/types";
import { fetchTextWithTimeout, fromCache, toCache } from "@/lib/checks/utils";
import type { ProviderRun } from "@/lib/checks/providers/types";
import { wrapEvidence } from "@/lib/checks/providers/shared";

const SOURCE = "Dutch Police (public pages)";
const CHECK_URL = "https://www.politie.nl/aangifte-of-melding-doen/controleer-handelspartij.html";
const LIST_URL = "https://www.politie.nl/aangifte-of-melding-doen/bekende-malafide-handelspartijen.html";

function extractDomainCandidates(text: string): string[] {
  const matches = text.match(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}\b/gi) ?? [];
  return [...new Set(matches.map((m) => normalizeDomain(m)))];
}

export async function runPoliceNlProvider(domain: string): Promise<ProviderRun<PoliceScamCheck>> {
  const timeoutMs = checksConfig.fetchTimeoutMs;
  const ttl = checksConfig.cacheTtlMs.policeNl;
  const normalizedDomain = normalizeDomain(domain);

  if (!checksConfig.policeNl) {
    return {
      evidence: [
        wrapEvidence(
          SOURCE,
          "government",
          "info",
          false,
          "Dutch Police page check disabled",
          "Structured comparison against politie.nl help pages was turned off.",
          "high"
        )
      ],
      result: {
        listedInPoliceScamDatabase: false,
        source: SOURCE,
        warnings: ["Police source disabled by configuration."]
      }
    };
  }

  const cacheKey = `checks:police:v2:${normalizedDomain}`;
  const cached = fromCache<{ check: PoliceScamCheck; evidence: ProviderRun<PoliceScamCheck>["evidence"] }>(cacheKey);
  if (cached) return { evidence: cached.evidence, result: cached.check };

  try {
    const [checkPage, listPage] = await Promise.all([
      fetchTextWithTimeout(CHECK_URL, timeoutMs),
      fetchTextWithTimeout(LIST_URL, timeoutMs)
    ]);
    const candidates = [...extractDomainCandidates(checkPage), ...extractDomainCandidates(listPage)];
    const uniqueCandidates = [...new Set(candidates)];
    const match = uniqueCandidates.find((candidate) => candidate === normalizedDomain);

    const result: PoliceScamCheck = match
      ? {
          listedInPoliceScamDatabase: true,
          policeScamMatch: match,
          policeWarningReason:
            "The domain string appears on cached extracts of Dutch Police consumer-safety pages. This is a heuristic match, not a legal determination.",
          source: SOURCE,
          warnings: []
        }
      : {
          listedInPoliceScamDatabase: false,
          source: SOURCE,
          warnings: []
        };

    const evidence = match
      ? [
          wrapEvidence(
            SOURCE,
            "government",
            "danger",
            true,
            "Reference overlap with Dutch Police public guidance pages",
            "Fraudly found the same domain string embedded in cached text from politie.nl “Check de verkoper” / known trading-party guidance. Verify on the official site; this tool does not access a private enforcement API.",
            "medium",
            { match }
          )
        ]
      : [
          wrapEvidence(
            SOURCE,
            "government",
            "info",
            false,
            "No Police page string match",
            "No direct domain string overlap was detected in lightly cached excerpts of the referenced politie.nl pages. Missing a hit is not proof a shop is trustworthy.",
            "low"
          )
        ];

    toCache(cacheKey, { check: result, evidence }, ttl);
    return { evidence, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Police check unavailable";
    return {
      evidence: [
        wrapEvidence(SOURCE, "government", "info", false, "Dutch Police page check unavailable", message, "low", {
          error: message
        })
      ],
      result: {
        listedInPoliceScamDatabase: false,
        source: SOURCE,
        warnings: [message]
      }
    };
  }
}
