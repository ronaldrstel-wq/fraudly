import { NextResponse } from "next/server";
import { backfillLatestPublicCheckCanonicalBatch } from "@/lib/admin/backfill-latest-public-check-canonical";
import { isAdminRecalcAuthorized } from "@/lib/admin/adminKeyAuth";
import { getCurrentUserIsAdmin } from "@/lib/auth/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

function parseBoolParam(value: string | null, defaultValue: boolean): boolean {
  if (value == null || value === "") return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return defaultValue;
}

function parseLimit(url: URL): number {
  const raw = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
  if (!Number.isFinite(raw) || raw < 1) return 50;
  return Math.min(raw, 100);
}

export async function POST(request: Request) {
  let isAdmin = false;
  try {
    isAdmin = await getCurrentUserIsAdmin();
  } catch {
    isAdmin = false;
  }

  if (!isAdmin && !isAdminRecalcAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = parseBoolParam(url.searchParams.get("dryRun"), true);
  const limit = parseLimit(url);
  const cursor = url.searchParams.get("cursor");

  try {
    const summary = await backfillLatestPublicCheckCanonicalBatch({
      dryRun,
      limit,
      cursor
    });

    return NextResponse.json({
      dryRun: summary.dryRun,
      schemaMode: summary.schemaMode,
      scanned: summary.scanned,
      updated: summary.updated,
      skipped: summary.skipped,
      errors: summary.errors,
      nextCursor: summary.hasMore ? summary.nextCursor : null,
      hasMore: summary.hasMore,
      failureExamples: summary.failureExamples,
      changedRows: summary.changedRows,
      cacheInvalidation: summary.cacheInvalidation,
      paginationNote:
        summary.hasMore && summary.nextCursor
          ? "limit applies per batch; pass nextCursor until hasMore is false."
          : null
    });
  } catch (err) {
    console.error("[admin/backfill-latest-public-check-canonical] batch failed", {
      dryRun,
      limit,
      hasCursor: Boolean(cursor),
      message: err instanceof Error ? err.message : String(err)
    });
    return NextResponse.json(
      {
        error: "backfill_failed",
        message: err instanceof Error ? err.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
