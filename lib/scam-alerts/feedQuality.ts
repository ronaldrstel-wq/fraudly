import { safeAlertDate } from "@/lib/scam-alerts/safeDates";
import type { PublicScamAlertListItem } from "@/lib/scam-alerts/service";

function alertSortTimestamp(row: PublicScamAlertListItem): number {
  const d =
    safeAlertDate(row.publishedAt) ?? safeAlertDate(row.lastSeenAt) ?? safeAlertDate(row.firstSeenAt);
  return d?.getTime() ?? 0;
}

/** Same normalization as `clusterDomainKey` in presentation (kept local to avoid import cycles). */
function clusterDomainKey(domain: string | null | undefined): string | null {
  if (!domain) return null;
  const d = domain.toLowerCase().replace(/^www\./, "").replace(/\.$/, "").trim();
  return d.length > 0 ? d : null;
}

/** Naive registrable-style root (last two labels); not a full PSL. */
function rootDomainFromHost(host: string): string {
  const parts = host.split(".").filter(Boolean);
  if (parts.length <= 2) return host.toLowerCase();
  return parts.slice(-2).join(".").toLowerCase();
}

/**
 * Dedupes by normalized hostname, prefers newest `publishedAt`, then caps at 3 alerts per
 * (root domain, source) pair to reduce noisy feed repeats.
 */
export function applyScamAlertFeedQuality(alerts: PublicScamAlertListItem[]): PublicScamAlertListItem[] {
  const sorted = [...alerts].sort((a, b) => alertSortTimestamp(b) - alertSortTimestamp(a));

  const seenHost = new Set<string>();
  const afterHostDedupe: PublicScamAlertListItem[] = [];
  for (const row of sorted) {
    const dk = clusterDomainKey(row.domain) ?? `id:${row.id}`;
    if (seenHost.has(dk)) continue;
    seenHost.add(dk);
    afterHostDedupe.push(row);
  }

  const rootSourceCount = new Map<string, number>();
  const out: PublicScamAlertListItem[] = [];
  for (const row of afterHostDedupe) {
    const dk = clusterDomainKey(row.domain);
    const root = dk ? rootDomainFromHost(dk) : `id:${row.id}`;
    const key = `${root}|${row.sourceName}`;
    const n = rootSourceCount.get(key) ?? 0;
    if (n >= 3) continue;
    rootSourceCount.set(key, n + 1);
    out.push(row);
  }

  return out;
}
