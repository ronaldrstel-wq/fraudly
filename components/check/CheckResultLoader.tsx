import { getCachedWebsiteAnalysis } from "@/lib/analysis/cachedAnalysis";
import type { CheckResultRouteSource } from "@/lib/check/checkResultHref";
import { logCheckDetailPerf } from "@/lib/check/checkDetailPerfLog";
import type { CheckAlignedDisplay } from "@/lib/check/alignedDisplayFromSnapshot";
import { ResultCard } from "@/components/ResultCard";
import { CheckSummaryDl } from "@/components/check/CheckSummaryDl";
import { displayTrustScoreForResult } from "@/lib/scanPresentation";

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
  const result = await getCachedWebsiteAnalysis(domain);
  const liveAnalysisFetchMs = Math.round(performance.now() - t0);
  const liveTrust = displayTrustScoreForResult(result);
  const trustScore = snapshotTrustScore ?? alignedDisplay?.trustScore ?? liveTrust;

  logCheckDetailPerf({
    routeSource,
    domain,
    scanId: scanId ?? alignedDisplay?.scanId ?? null,
    liveAnalysisFetchMs,
    resultSource: "live-cache"
  });

  return (
    <>
      <CheckSummaryDl trustScore={trustScore} result={result} />
      <div className="mt-8 max-w-4xl">
        <ResultCard result={result} alignedDisplay={alignedDisplay} />
      </div>
    </>
  );
}
