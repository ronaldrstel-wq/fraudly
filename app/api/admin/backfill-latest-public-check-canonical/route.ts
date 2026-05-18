import { NextResponse } from "next/server";
import {
  backfillLatestPublicCheckCanonicalBatch,
  getLatestPublicCheckBackfillSchemaCheck
} from "@/lib/admin/backfill-latest-public-check-canonical";
import { isBackfillAdminAuthorized } from "@/lib/admin/backfill-latest-public-check-canonical-auth";
import {
  parseBackfillBoolParam,
  parseBackfillLimit
} from "@/lib/admin/backfill-latest-public-check-canonical-params";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Schema probe — run before canonical backfill on production. */
export async function GET(request: Request) {
  if (!(await isBackfillAdminAuthorized(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const schemaCheck = await getLatestPublicCheckBackfillSchemaCheck();
    return NextResponse.json({
      ok: schemaCheck.canWriteCanonicalColumns,
      schemaCheck,
      readyForCanonicalBackfill: schemaCheck.canWriteCanonicalColumns,
      deployCommand: "npx prisma migrate deploy"
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "schema_check_failed",
        message: err instanceof Error ? err.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await isBackfillAdminAuthorized(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = parseBackfillBoolParam(url.searchParams.get("dryRun"), true);
  const limit = parseBackfillLimit(url.searchParams.get("limit"), 50);
  const cursor = url.searchParams.get("cursor");
  const requireCanonicalColumns = parseBackfillBoolParam(url.searchParams.get("requireCanonical"), true);

  try {
    const summary = await backfillLatestPublicCheckCanonicalBatch({
      dryRun,
      limit,
      cursor,
      requireCanonicalColumns
    });

    if (summary.blockedReason) {
      return NextResponse.json(
        {
          error: "migration_required",
          message: summary.blockedReason,
          dryRun: summary.dryRun,
          schemaMode: summary.schemaMode,
          schemaCheck: summary.schemaCheck,
          blockedReason: summary.blockedReason,
          deployCommand: "npx prisma migrate deploy"
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      dryRun: summary.dryRun,
      schemaMode: summary.schemaMode,
      schemaCheck: summary.schemaCheck,
      scanned: summary.scanned,
      updated: summary.updated,
      skipped: summary.skipped,
      errors: summary.errors,
      nextCursor: summary.hasMore ? summary.nextCursor : null,
      hasMore: summary.hasMore,
      failureExamples: summary.failureExamples,
      changedRows: summary.changedRows,
      cacheInvalidation: summary.cacheInvalidation,
      blockedReason: summary.blockedReason,
      paginationNote:
        summary.hasMore && summary.nextCursor
          ? "Single-page batch. For full table use POST /api/admin/backfill-latest-public-check-canonical/run-all"
          : null,
      runAllEndpoint: "/api/admin/backfill-latest-public-check-canonical/run-all"
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
