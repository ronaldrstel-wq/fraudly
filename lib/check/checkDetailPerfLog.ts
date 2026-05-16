import type { CheckResultRouteSource } from "@/lib/check/checkResultHref";

export type CheckDetailPerfEvent = {
  routeSource: CheckResultRouteSource | "unknown";
  domain: string;
  scanId?: string | null;
  snapshotFetchMs?: number;
  enrichmentFetchMs?: number;
  liveAnalysisFetchMs?: number;
  totalPageMs?: number;
  resultSource?: "stored-payload" | "live-cache" | "pending";
};

/** Development-only navigation timing for latest-card → detail flows. */
export function logCheckDetailPerf(event: CheckDetailPerfEvent): void {
  if (process.env.NODE_ENV === "production") return;
  console.info("[check-detail-perf]", event);
}
