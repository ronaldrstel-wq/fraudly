import type { PublicCheckLinkItem } from "@/lib/seo/public-check-links";

function domainTld(domain: string): string {
  const parts = domain.toLowerCase().split(".");
  if (parts.length < 2) return "";
  return parts[parts.length - 1] ?? "";
}

function domainTokens(domain: string): string[] {
  return domain
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3);
}

function scoreRelated(a: PublicCheckLinkItem, b: PublicCheckLinkItem): number {
  let score = 0;
  if (a.trustBand === b.trustBand) score += 4;
  if (domainTld(a.domain) === domainTld(b.domain) && domainTld(a.domain)) score += 3;
  const aTokens = domainTokens(a.domain);
  const bTokens = domainTokens(b.domain);
  const overlap = aTokens.filter((t) => bTokens.includes(t)).length;
  score += overlap * 2;
  if (a.trustScore < 50 && b.trustScore < 50) score += 1;
  return score;
}

/**
 * Picks related public checks for /check/[domain] internal linking.
 * Uses verdict band, TLD, keyword overlap, then high-risk recency fallback.
 */
export function pickRelatedPublicChecks(
  currentDomain: string,
  pool: PublicCheckLinkItem[],
  limit = 8
): PublicCheckLinkItem[] {
  const current = currentDomain.trim().toLowerCase();
  const others = pool.filter((p) => p.domain.toLowerCase() !== current);
  if (others.length === 0) return [];

  const currentItem = pool.find((p) => p.domain.toLowerCase() === current);
  const ref: PublicCheckLinkItem =
    currentItem ??
    ({
      id: "synthetic-ref",
      domain: current,
      displayLabel: current,
      href: `/check/${encodeURIComponent(current)}`,
      trustScore: 50,
      verdictLabel: "Use Caution",
      trustBand: "caution",
      scorePillClass: "",
      stripeClass: ""
    } satisfies PublicCheckLinkItem);

  const ranked = others
    .map((item) => ({ item, score: scoreRelated(ref, item) }))
    .sort((a, b) => b.score - a.score || a.item.trustScore - b.item.trustScore);

  const picked: PublicCheckLinkItem[] = [];
  const seen = new Set<string>();

  for (const { item } of ranked) {
    if (picked.length >= limit) break;
    if (seen.has(item.domain)) continue;
    seen.add(item.domain);
    picked.push(item);
  }

  if (picked.length < limit) {
    const byRisk = [...others].sort((a, b) => a.trustScore - b.trustScore);
    for (const item of byRisk) {
      if (picked.length >= limit) break;
      if (seen.has(item.domain)) continue;
      seen.add(item.domain);
      picked.push(item);
    }
  }

  return picked.slice(0, limit);
}

/** “People also checked” — recent pool minus current domain. */
export function pickPeopleAlsoChecked(
  currentDomain: string,
  pool: PublicCheckLinkItem[],
  limit = 6
): PublicCheckLinkItem[] {
  const current = currentDomain.trim().toLowerCase();
  return pool.filter((p) => p.domain.toLowerCase() !== current).slice(0, limit);
}
