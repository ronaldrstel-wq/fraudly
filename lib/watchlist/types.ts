/**
 * Shared watchlist types (safe for Client Components — no `@prisma/client` import).
 */

export type WatchlistItemTypeSlug = "domain" | "url" | "email" | "phone";

export const WATCHLIST_ITEM_TYPES: readonly WatchlistItemTypeSlug[] = ["domain", "url", "email", "phone"];

export type WatchlistApiItem = {
  id: string;
  itemType: WatchlistItemTypeSlug;
  externalKey: string;
  title: string;
  detailPath: string;
  trustScore: number | null;
  verdict: string | null;
  createdAt: string;
  updatedAt: string;
};

export function isWatchlistItemTypeSlug(value: unknown): value is WatchlistItemTypeSlug {
  return typeof value === "string" && (WATCHLIST_ITEM_TYPES as readonly string[]).includes(value);
}
