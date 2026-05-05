import type { WatchlistItem } from "@prisma/client";
import type { WatchlistApiItem } from "@/lib/watchlist/types";

export function prismaWatchlistRowToApi(row: WatchlistItem): WatchlistApiItem {
  return {
    id: row.id,
    itemType: row.itemType as WatchlistApiItem["itemType"],
    externalKey: row.externalKey,
    title: row.title,
    detailPath: row.detailPath,
    trustScore: row.trustScore ?? null,
    verdict: row.verdict ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}
