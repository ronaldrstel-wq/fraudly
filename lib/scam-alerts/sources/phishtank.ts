import { normalizeDomain } from "@/lib/cache";
import { getJson } from "@/lib/scam-alerts/sources/shared";
import type { NormalizedScamSignal } from "@/lib/scam-alerts/types";

type PhishTankEntry = {
  phish_id?: string;
  url?: string;
  verified?: string;
  submission_time?: string;
  target?: string;
};

export async function fetchPhishTankSignals(): Promise<NormalizedScamSignal[]> {
  const apiKey = process.env.PHISHTANK_API_KEY?.trim();
  if (!apiKey) return [];
  const payload = await getJson<PhishTankEntry[]>(
    "https://data.phishtank.com/data/online-valid.json",
    apiKey
  );
  return (payload ?? [])
    .filter((row) => row.url && row.verified === "yes")
    .slice(0, 300)
    .map((row) => {
      const normalized = normalizeDomain(row.url!);
      return {
        source: "phishtank",
        sourceRef: row.phish_id ?? row.url,
        url: row.url,
        domain: normalized,
        normalizedDomain: normalized,
        scamType: row.target ? "brand impersonation" : "phishing",
        affectedBrand: row.target || undefined,
        riskLevel: "critical",
        confidence: 0.95,
        firstSeenAt: row.submission_time ? new Date(row.submission_time) : undefined,
        lastSeenAt: row.submission_time ? new Date(row.submission_time) : undefined,
        evidence: {
          verified: row.verified,
          target: row.target
        }
      } satisfies NormalizedScamSignal;
    });
}
