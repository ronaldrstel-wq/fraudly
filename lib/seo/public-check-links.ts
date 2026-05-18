import { buildOverviewFromPublicCheck } from "@/lib/overviewCardPresentation";
import { overviewFeedPrimaryLine } from "@/lib/overviewFeedDisplay";
import { fetchLatestPublicChecksPage } from "@/lib/latest-public-checks/listPublicChecks";
import type { LatestPublicCheckListRow } from "@/lib/latest-public-checks/listPublicChecks";
import { getTrustBandFromScore, type TrustBandId } from "@/lib/scoring/trust-bands";
import { getOverviewFeedCardVisual } from "@/lib/scoring/trust-bands";

/** Public, crawl-safe fields for internal SEO link lists. */
export type PublicCheckLinkItem = {
  id: string;
  domain: string;
  displayLabel: string;
  href: string;
  trustScore: number;
  verdictLabel: string;
  trustBand: TrustBandId;
  scorePillClass: string;
  stripeClass: string;
};

function rowToLinkItem(row: LatestPublicCheckListRow, href: string): PublicCheckLinkItem | null {
  try {
    const overview = buildOverviewFromPublicCheck(row);
    const primary = overviewFeedPrimaryLine(row.checkedValue ?? row.normalizedValue);
    const domain = row.normalizedValue?.trim() || primary.primary;
    if (!domain) return null;
    const visual = getOverviewFeedCardVisual(overview.trustScore);
    return {
      id: row.id,
      domain,
      displayLabel: primary.primary || domain,
      href,
      trustScore: overview.trustScore,
      verdictLabel: overview.verdictLabel,
      trustBand: getTrustBandFromScore(overview.trustScore),
      scorePillClass: visual.scorePill,
      stripeClass: visual.stripe
    };
  } catch {
    return null;
  }
}

/** Plain /check/[domain] href for crawlers (no scanId query). */
export function publicCheckPath(domain: string): string {
  return `/check/${encodeURIComponent(domain.trim().toLowerCase())}`;
}

export async function fetchPublicCheckLinkItems(limit: number): Promise<PublicCheckLinkItem[]> {
  const take = Math.max(1, Math.min(50, Math.round(limit)));
  const { rows, loadFailed } = await fetchLatestPublicChecksPage(0, take);
  if (loadFailed) return [];

  const items: PublicCheckLinkItem[] = [];
  for (const row of rows) {
    const item = rowToLinkItem(row, publicCheckPath(row.normalizedValue));
    if (item) items.push(item);
  }
  return items;
}

/** Higher-risk recent checks for “trending” when no popularity data exists. */
export async function fetchTrendingPublicCheckLinkItems(
  limit: number,
  excludeDomains: string[] = []
): Promise<PublicCheckLinkItem[]> {
  const exclude = new Set(excludeDomains.map((d) => d.trim().toLowerCase()));
  const { rows, loadFailed } = await fetchLatestPublicChecksPage(0, 40);
  if (loadFailed) return [];

  const candidates: PublicCheckLinkItem[] = [];
  for (const row of rows) {
    const domain = row.normalizedValue?.trim().toLowerCase();
    if (!domain || exclude.has(domain)) continue;
    const item = rowToLinkItem(row, publicCheckPath(domain));
    if (item) candidates.push(item);
  }

  candidates.sort((a, b) => a.trustScore - b.trustScore);
  return candidates.slice(0, Math.max(1, Math.min(20, Math.round(limit))));
}
