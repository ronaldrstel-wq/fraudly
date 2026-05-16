import type { NormalizedTrustResult } from "@/lib/trust/types";
import { TrustSummaryMetrics } from "@/components/trust/TrustSummaryMetrics";

export function CheckSummaryDl({ normalized }: { normalized: NormalizedTrustResult }) {
  return <TrustSummaryMetrics normalized={normalized} variant="check" />;
}
