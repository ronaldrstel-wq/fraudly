import type { DataConfidenceBadgeModel } from "@/lib/trust/dataConfidence";
import { dataConfidenceBadge, reputationStaleIndicator } from "@/lib/trust/dataConfidence";

export type FeedListRowConfidenceInput = {
  normalizedTrustScore?: number | null;
  consumerVerdictLabel?: string | null;
  lastSeenAt: Date;
};

/** Subtle latest-checks confidence strip — metadata only, no score changes. */
export function feedListRowConfidenceBadges(row: FeedListRowConfidenceInput): DataConfidenceBadgeModel[] {
  const badges: DataConfidenceBadgeModel[] = [];
  const stale = reputationStaleIndicator(row.lastSeenAt.toISOString());
  if (stale) badges.push(dataConfidenceBadge(stale));

  if (row.normalizedTrustScore != null && row.consumerVerdictLabel) {
    badges.push(dataConfidenceBadge("verified"));
  } else if (row.normalizedTrustScore != null) {
    badges.push(dataConfidenceBadge("limited"));
  } else {
    badges.push(dataConfidenceBadge("limited"));
  }

  return badges.slice(0, 2);
}
