import { fetchJsonWithTimeout } from "@/lib/checks/utils";
import type { NormalizedScamSignal } from "@/lib/scam-alerts/types";

export type SourceFetchResult = {
  source: string;
  signals: NormalizedScamSignal[];
  error?: string;
};

export const SOURCE_TIMEOUT_MS = 7000;

export async function safeSourceFetch(
  source: string,
  fetcher: () => Promise<NormalizedScamSignal[]>
): Promise<SourceFetchResult> {
  try {
    const signals = await fetcher();
    return { source, signals };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error(`[scam-alerts][source:${source}]`, message);
    return { source, signals: [], error: message };
  }
}

export async function getJson<T>(url: string, apiKey?: string): Promise<T> {
  return fetchJsonWithTimeout<T>(url, SOURCE_TIMEOUT_MS, {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined
  });
}
