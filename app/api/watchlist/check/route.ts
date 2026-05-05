import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBillingUserOrNull } from "@/lib/user-store";
import { isWatchlistItemTypeSlug } from "@/lib/watchlist/types";
import { normalizeWatchlistExternalKey } from "@/lib/watchlist/normalize";
import type { WatchlistItemType } from "@prisma/client";

export async function GET(request: NextRequest) {
  const user = await getBillingUserOrNull();
  const itemTypeParam = request.nextUrl.searchParams.get("itemType") ?? "";
  const rawKey = request.nextUrl.searchParams.get("externalKey") ?? "";

  if (!isWatchlistItemTypeSlug(itemTypeParam)) {
    return NextResponse.json({ error: "bad_request", watched: false, id: null }, { status: 400 });
  }

  let externalKey: string;
  try {
    externalKey = normalizeWatchlistExternalKey(itemTypeParam, rawKey);
  } catch {
    return NextResponse.json({ error: "bad_request", watched: false, id: null }, { status: 400 });
  }

  if (!user) {
    return NextResponse.json({ watched: false, id: null });
  }

  try {
    const row = await db.watchlistItem.findUnique({
      where: {
        userId_itemType_externalKey: {
          userId: user.id,
          itemType: itemTypeParam as WatchlistItemType,
          externalKey
        }
      },
      select: { id: true }
    });

    return NextResponse.json({
      watched: Boolean(row),
      id: row?.id ?? null
    });
  } catch {
    return NextResponse.json({ error: "server_error", watched: false, id: null }, { status: 500 });
  }
}
