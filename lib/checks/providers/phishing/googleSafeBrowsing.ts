import { checksConfig } from "@/lib/checks/config";
import type { SafeBrowsingCheck } from "@/lib/checks/types";
import { fetchJsonWithTimeout, fromCache, toCache } from "@/lib/checks/utils";
import type { ProviderEvidenceResult, ProviderRun } from "@/lib/checks/providers/types";
import { wrapEvidence } from "@/lib/checks/providers/shared";

const SOURCE = "Google Safe Browsing";

type SafeBrowsingResponse = {
  matches?: Array<{ threatType?: string }>;
};

function categoryForThreat(threat: string): "phishing" | "malware" {
  const t = threat.toUpperCase();
  if (t.includes("SOCIAL") || t.includes("ENGINEERING")) return "phishing";
  return "malware";
}

export async function runGoogleSafeBrowsingProvider(url: string): Promise<ProviderRun<SafeBrowsingCheck>> {
  const timeoutMs = checksConfig.fetchTimeoutMs;
  const ttl = checksConfig.cacheTtlMs.safeBrowsing;

  if (!checksConfig.googleSafeBrowsing) {
    const result: SafeBrowsingCheck = {
      safeBrowsingStatus: "unknown",
      safeBrowsingThreats: [],
      source: SOURCE,
      warnings: ["Google Safe Browsing disabled by configuration."]
    };
    return {
      evidence: [
        wrapEvidence(
          SOURCE,
          "malware",
          "info",
          false,
          "Google Safe Browsing disabled",
          "This intelligence source was turned off in configuration.",
          "high"
        )
      ],
      result
    };
  }

  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY?.trim();
  if (!apiKey) {
    const result: SafeBrowsingCheck = {
      safeBrowsingStatus: "unknown",
      safeBrowsingThreats: [],
      source: SOURCE,
      warnings: ["GOOGLE_SAFE_BROWSING_API_KEY missing."]
    };
    return {
      evidence: [
        wrapEvidence(
          SOURCE,
          "malware",
          "info",
          false,
          "Google Safe Browsing not configured",
          "No API key is set, so threat matches cannot be requested.",
          "high"
        )
      ],
      result
    };
  }

  const cacheKey = `checks:safebrowsing:v2:${url}`;
  const cached = fromCache<{ check: SafeBrowsingCheck; evidence: ProviderRun<SafeBrowsingCheck>["evidence"] }>(cacheKey);
  if (cached) {
    return { evidence: cached.evidence, result: cached.check };
  }

  try {
    const response = await fetchJsonWithTimeout<SafeBrowsingResponse>(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      timeoutMs,
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

    const threats = [...new Set((response.matches ?? []).map((m) => m.threatType).filter((t): t is string => Boolean(t)))];
    const result: SafeBrowsingCheck = {
      safeBrowsingStatus: threats.length > 0 ? "flagged" : "safe",
      safeBrowsingThreats: threats,
      source: SOURCE,
      warnings: []
    };

    const primaryCategory =
      threats.some((t) => categoryForThreat(t) === "phishing") && threats.some((t) => categoryForThreat(t) === "malware")
        ? "malware"
        : threats.some((t) => categoryForThreat(t) === "phishing")
          ? "phishing"
          : "malware";

    let evidence: ProviderEvidenceResult[] =
      threats.length > 0
        ? [
            wrapEvidence(
              SOURCE,
              primaryCategory,
              "danger",
              true,
              "Appears in Google Safe Browsing intelligence",
              `Threat types reported include: ${threats.join(", ")}. Treat this as an external risk indicator; it does not by itself prove user harm.`,
              "high",
              { threatTypes: threats }
            )
          ]
        : [];

    if (evidence.length === 0) {
      evidence = [
        wrapEvidence(
          SOURCE,
          "malware",
          "positive",
          false,
          "No Google Safe Browsing match",
          "No malware, phishing-style social-engineering, unwanted-software or potentially harmful-application match was returned for this URL in this lookup.",
          "high",
          { status: "safe" }
        )
      ];
    }

    toCache(cacheKey, { check: result, evidence }, ttl);
    return { evidence, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Safe Browsing unavailable";
    const result: SafeBrowsingCheck = {
      safeBrowsingStatus: "unknown",
      safeBrowsingThreats: [],
      source: SOURCE,
      warnings: [message]
    };
    return {
      evidence: [
        wrapEvidence(SOURCE, "malware", "info", false, "Google Safe Browsing lookup failed", message, "low", {
          error: message
        })
      ],
      result
    };
  }
}
