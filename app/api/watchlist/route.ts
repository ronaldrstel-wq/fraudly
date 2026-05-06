import { type NextRequest, NextResponse } from "next/server";
import type { ScamVerdict } from "@/types/scam";
import { db } from "@/lib/db";
import { prismaWatchlistRowToApi } from "@/lib/watchlist/serialize-prisma";
import { assertDetailPathRelative, normalizeWatchlistExternalKey } from "@/lib/watchlist/normalize";
import { isWatchlistItemTypeSlug } from "@/lib/watchlist/types";
import { AuthRequiredError, requireBillingUser } from "@/lib/user-store";
import { EN_MESSAGES } from "@/lib/messages.en";
import type { WatchlistItemType } from "@prisma/client";

function isScamVerdict(value: unknown): value is ScamVerdict {
  return value === "safe" || value === "suspicious" || value === "scam";
}

export async function GET() {
  try {
    const user = await requireBillingUser();
    const rows = await db.watchlistItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json({ items: rows.map(prismaWatchlistRowToApi) });
  } catch (e) {
    if (e instanceof AuthRequiredError) {
      return NextResponse.json(
        { error: "unauthorized", message: EN_MESSAGES.watchlist.loginToView },
        { status: 401 }
      );
    }
    throw e;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireBillingUser();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "bad_request", message: "Invalid JSON" }, { status: 400 });
    }

    const o = body as Record<string, unknown>;
    const itemTypeRaw = o.itemType;
    const rawKey = typeof o.rawKey === "string" ? o.rawKey : typeof o.externalKey === "string" ? o.externalKey : "";
    const title = typeof o.title === "string" ? o.title.trim() : "";
    const detailPathRaw = typeof o.detailPath === "string" ? o.detailPath : "";

    if (!isWatchlistItemTypeSlug(itemTypeRaw)) {
      return NextResponse.json({ error: "bad_request", message: "Invalid item type" }, { status: 400 });
    }

    let detailPath: string;
    try {
      detailPath = assertDetailPathRelative(detailPathRaw);
    } catch {
      return NextResponse.json({ error: "bad_request", message: "Invalid detail path" }, { status: 400 });
    }

    let externalKey: string;
    try {
      externalKey = normalizeWatchlistExternalKey(itemTypeRaw, rawKey);
    } catch {
      return NextResponse.json({ error: "bad_request", message: "Invalid key" }, { status: 400 });
    }

    const safeTitle =
      title.length > 0
        ? title.slice(0, 512)
        : itemTypeRaw === "domain"
          ? externalKey
          : externalKey.slice(0, 512);

    let trustScore: number | undefined;
    if (o.trustScore === null || o.trustScore === undefined) trustScore = undefined;
    else if (typeof o.trustScore !== "number" || Number.isNaN(o.trustScore)) trustScore = undefined;
    else trustScore = Math.max(0, Math.min(100, Math.round(o.trustScore)));

    let verdict: string | undefined;
    if (o.verdict === null || o.verdict === undefined) verdict = undefined;
    else if (typeof o.verdict === "string" && isScamVerdict(o.verdict.trim())) verdict = o.verdict.trim();
    else verdict = undefined;

    const prismaType = itemTypeRaw as WatchlistItemType;

    const row = await db.watchlistItem.upsert({
      where: {
        userId_itemType_externalKey: {
          userId: user.id,
          itemType: prismaType,
          externalKey
        }
      },
      update: {
        title: safeTitle,
        detailPath,
        trustScore,
        verdict: verdict ?? null
      },
      create: {
        userId: user.id,
        itemType: prismaType,
        externalKey,
        title: safeTitle,
        detailPath,
        trustScore,
        verdict: verdict ?? null
      }
    });

    return NextResponse.json({
      ok: true,
      item: prismaWatchlistRowToApi(row)
    });
  } catch (e) {
    if (e instanceof AuthRequiredError) {
      return NextResponse.json(
        { error: "unauthorized", message: EN_MESSAGES.watchlist.loginToManage },
        { status: 401 }
      );
    }
    console.error("[watchlist POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  try {
    const user = await requireBillingUser();

    if (!id || typeof id !== "string" || id.trim().length < 1) {
      return NextResponse.json({ error: "bad_request", message: "Missing id" }, { status: 400 });
    }

    const deleted = await db.watchlistItem.deleteMany({
      where: { id: id.trim(), userId: user.id }
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "not_found", message: "Nothing to remove" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthRequiredError) {
      return NextResponse.json(
        { error: "unauthorized", message: EN_MESSAGES.watchlist.loginToManage },
        { status: 401 }
      );
    }
    throw e;
  }
}
