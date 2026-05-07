import { getJson } from "@/lib/scam-alerts/sources/shared";
import type { NormalizedScamSignal } from "@/lib/scam-alerts/types";

type GoogleSafeBrowsingLookup = {
  threatEntries?: Array<{ url?: string }>;
};

export async function fetchGoogleRiskSignals(): Promise<NormalizedScamSignal[]> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY?.trim() || process.env.GOOGLE_WEB_RISK_API_KEY?.trim();
  if (!apiKey) return [];

  // This source is enrichment-only in cron mode. Without a candidate URL list to query,
  // we do not synthesize data. Keep as safe no-op unless wired with candidate batches later.
  void (await Promise.resolve<GoogleSafeBrowsingLookup>({}));
  return [];
}
