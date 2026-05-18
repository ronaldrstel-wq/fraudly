import { NextResponse } from "next/server";
import { backfillLatestPublicCheckCanonicalRunAll } from "@/lib/admin/backfill-latest-public-check-canonical-run-all";
import { isBackfillAdminAuthorized } from "@/lib/admin/backfill-latest-public-check-canonical-auth";
import {
  parseBackfillBoolParam,
  parseBackfillLimit,
  parseBackfillMaxBatches,
  parseBackfillMaxDurationMs
} from "@/lib/admin/backfill-latest-public-check-canonical-params";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!(await isBackfillAdminAuthorized(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = parseBackfillBoolParam(url.searchParams.get("dryRun"), true);
  const limit = parseBackfillLimit(url.searchParams.get("limit"), 50);
  const cursor = url.searchParams.get("cursor");
  const requireCanonicalColumns = parseBackfillBoolParam(url.searchParams.get("requireCanonical"), true);
  const maxBatches = parseBackfillMaxBatches(url.searchParams.get("maxBatches"), 500);
  const maxDurationMs = parseBackfillMaxDurationMs(url.searchParams.get("maxDurationMs"), 55_000);

  try {
    const summary = await backfillLatestPublicCheckCanonicalRunAll({
      dryRun,
      batchSize: limit,
      cursor,
      requireCanonicalColumns,
      maxBatches,
      maxDurationMs
    });

    if (summary.blockedReason) {
      return NextResponse.json(
        {
          error: "migration_required",
          message: summary.blockedReason,
          ...summary,
          deployCommand: "npx prisma migrate deploy"
        },
        { status: 409 }
      );
    }

    const status = summary.completed ? 200 : 202;

    return NextResponse.json(
      {
        ...summary,
        resumeHint: summary.resumeCursor
          ? `Re-run with &cursor=${encodeURIComponent(summary.resumeCursor)} to continue (${summary.stoppedReason}).`
          : null
      },
      { status }
    );
  } catch (err) {
    console.error("[admin/backfill-latest-public-check-canonical/run-all] failed", {
      dryRun,
      limit,
      maxBatches,
      maxDurationMs,
      hasCursor: Boolean(cursor),
      message: err instanceof Error ? err.message : String(err)
    });
    return NextResponse.json(
      {
        error: "backfill_run_all_failed",
        message: err instanceof Error ? err.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
