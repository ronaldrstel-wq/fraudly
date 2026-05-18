import type { CheckResultRouteSource } from "@/lib/check/checkResultHref";
import { logCheckDetailPerf } from "@/lib/check/checkDetailPerfLog";
import type { CheckAlignedDisplay } from "@/lib/check/alignedDisplayFromSnapshot";
import { ResultCard } from "@/components/ResultCard";
import { CheckSummaryDl } from "@/components/check/CheckSummaryDl";
import { loadTrustViewForDomain } from "@/lib/trust/loadTrustView";

export async function CheckResultLoader({
  domain,
  alignedDisplay,
  routeSource,
  scanId,
  snapshotTrustScore
}: {
  domain: string;
  alignedDisplay?: CheckAlignedDisplay;
  routeSource: CheckResultRouteSource | "unknown";
  scanId?: string;
  snapshotTrustScore?: number | null;
}) {
  const t0 = performance.now();
  const { result, normalized } = await loadTrustViewForDomain(domain, `CheckResultLoader:${routeSource}`, {
    preferredScanId: scanId
  });
  const liveAnalysisFetchMs = Math.round(performance.now() - t0);
  void snapshotTrustScore;

  logCheckDetailPerf({
    routeSource,
    domain,
    scanId: scanId ?? alignedDisplay?.scanId ?? normalized.scanId ?? null,
    liveAnalysisFetchMs,
    resultSource: "live-cache"
  });

  return (
    <>
      <CheckSummaryDl normalized={normalized} />
      <div className="mt-8 max-w-4xl">
        <ResultCard result={result} normalizedTrust={normalized} alignedDisplay={alignedDisplay} />
      </div>
    </>
  );
}
