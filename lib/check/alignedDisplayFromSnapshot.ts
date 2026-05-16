import { buildOverviewFromTrustAndVerdict } from "@/lib/overviewCardPresentation";
import type { LatestPublicCheckSnapshot } from "@/lib/latest-public-checks/snapshot";
import type { HumanRecKind } from "@/lib/scanResultDualLayer";

export type CheckAlignedDisplay = {
  trustScore: number;
  label: string;
  humanKind: HumanRecKind;
  humanHeadline: string;
  scanId: string;
  lastSeenAtIso: string;
};

export function alignedDisplayFromSnapshot(
  snapshot: LatestPublicCheckSnapshot
): CheckAlignedDisplay {
  const overview = buildOverviewFromTrustAndVerdict(
    snapshot.display.trustScore,
    snapshot.display.verdict
  );
  return {
    trustScore: overview.trustScore,
    label: overview.verdictLabel,
    humanKind: overview.humanKind,
    humanHeadline: overview.headline,
    scanId: snapshot.id,
    lastSeenAtIso: snapshot.lastSeenAt.toISOString()
  };
}
