import { buildOverviewFromTrustAndVerdict } from "@/lib/overviewCardPresentation";
import { scamVerdictFromConsumerLabel } from "@/lib/scoring/consumerVerdictMap";
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
  const consumerLabel = snapshot.display.label;
  const overview = buildOverviewFromTrustAndVerdict(
    snapshot.display.trustScore,
    scamVerdictFromConsumerLabel(consumerLabel)
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
