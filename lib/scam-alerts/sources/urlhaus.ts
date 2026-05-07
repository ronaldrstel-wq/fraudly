import { normalizeDomain } from "@/lib/cache";
import { getJson } from "@/lib/scam-alerts/sources/shared";
import type { NormalizedScamSignal } from "@/lib/scam-alerts/types";

type UrlhausRecentResponse = {
  urls?: Array<{
    id?: string;
    url?: string;
    date_added?: string;
    threat?: string;
    tags?: string[];
  }>;
};

export async function fetchUrlhausSignals(): Promise<NormalizedScamSignal[]> {
  const payload = await getJson<UrlhausRecentResponse>("https://urlhaus-api.abuse.ch/v1/urls/recent/");
  const urls = payload.urls ?? [];
  return urls
    .filter((row) => typeof row.url === "string" && row.url.length > 0)
    .slice(0, 300)
    .map((row) => {
      const normalized = normalizeDomain(row.url!);
      return {
        source: "urlhaus",
        sourceRef: row.id ?? row.url,
        url: row.url,
        domain: normalized,
        normalizedDomain: normalized,
        scamType: /phish/i.test(`${row.threat ?? ""} ${(row.tags ?? []).join(" ")}`)
          ? "phishing"
          : "malware",
        riskLevel: "critical",
        confidence: 0.95,
        firstSeenAt: row.date_added ? new Date(row.date_added) : undefined,
        lastSeenAt: row.date_added ? new Date(row.date_added) : undefined,
        evidence: {
          threat: row.threat,
          tags: row.tags ?? []
        }
      } satisfies NormalizedScamSignal;
    });
}
