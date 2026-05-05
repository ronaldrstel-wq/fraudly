import { normalizeDomain } from "@/lib/cache";
import type { WatchlistItemTypeSlug } from "@/lib/watchlist/types";

export function normalizeWatchlistExternalKey(itemType: WatchlistItemTypeSlug, raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed && itemType === "domain") {
    throw new Error("missing_domain_key");
  }
  if (itemType === "domain") {
    return normalizeDomain(trimmed);
  }
  if (itemType === "email") {
    return trimmed.toLowerCase();
  }
  if (itemType === "phone") {
    return trimmed.replace(/\s+/g, "");
  }
  return trimmed.slice(0, 2048);
}

export function assertDetailPathRelative(pathname: string): string {
  const p = pathname.trim().split(/\s+/)[0]!;
  if (!p.startsWith("/") || p.startsWith("//")) {
    throw new Error("invalid_detail_path");
  }
  return p.slice(0, 2048);
}
