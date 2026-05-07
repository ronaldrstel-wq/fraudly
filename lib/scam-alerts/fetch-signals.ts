import { safeSourceFetch } from "@/lib/scam-alerts/sources/shared";
import { fetchInternalFraudlySignals } from "@/lib/scam-alerts/sources/internal-fraudly";
import { fetchUrlhausSignals } from "@/lib/scam-alerts/sources/urlhaus";
import { fetchPhishTankSignals } from "@/lib/scam-alerts/sources/phishtank";
import { fetchGoogleRiskSignals } from "@/lib/scam-alerts/sources/google-risk";
import type { NormalizedScamSignal } from "@/lib/scam-alerts/types";

export type SourceFetchSummary = {
  source: string;
  count: number;
  error?: string;
};

export async function fetchAllScamSignals(): Promise<{
  signals: NormalizedScamSignal[];
  summary: SourceFetchSummary[];
}> {
  const results = await Promise.all([
    safeSourceFetch("internal", fetchInternalFraudlySignals),
    safeSourceFetch("urlhaus", fetchUrlhausSignals),
    safeSourceFetch("phishtank", fetchPhishTankSignals),
    safeSourceFetch("google-risk", fetchGoogleRiskSignals)
  ]);

  return {
    signals: results.flatMap((r) => r.signals),
    summary: results.map((r) => ({ source: r.source, count: r.signals.length, error: r.error }))
  };
}
