import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isAdminRecalcAuthorized } from "@/lib/admin/adminKeyAuth";
import { getDatabaseConnectionDiagnostics } from "@/lib/db/connectionDiagnostics";
import { getPublicFeatureFlagsSnapshot } from "@/lib/env/publicFeatureFlags";
import { probeLatestChecksDatabase } from "@/lib/latest-public-checks/dbProbe";
import {
  fetchLatestPublicChecksPage,
  latestChecksCacheBypassEnabled
} from "@/lib/latest-public-checks/listPublicChecks";
import { LATEST_PUBLIC_CHECKS_CACHE_TAG } from "@/lib/trust/cacheTags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminRecalcAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const dbConnection = getDatabaseConnectionDiagnostics();
  const probe = await probeLatestChecksDatabase(10);

  const listCached = await fetchLatestPublicChecksPage(0, 10, { bypassCache: false });
  const listUncached = await fetchLatestPublicChecksPage(0, 10, { bypassCache: true });

  const rowsFilteredInUi = 0;
  const diagnosis: string[] = [];

  if (!dbConnection.configured) {
    diagnosis.push("DATABASE_URL is not set in this runtime.");
  }
  if (probe.connectionError) {
    diagnosis.push(`Database connection failed: ${probe.connectionError}`);
  }
  if (probe.connected && probe.latestPublicCheckCount === 0) {
    diagnosis.push(
      "Connected successfully but LatestPublicCheck has zero rows — likely wrong Neon branch/empty database, not a UI filter issue."
    );
  }
  if (probe.connected && (probe.latestPublicCheckCount ?? 0) > 0 && listUncached.rows.length === 0) {
    diagnosis.push(
      "Rows exist in DB but listPublicChecks returned empty — check Prisma schema/migration mismatch (P2022) or query error (loadFailed)."
    );
  }
  if (listCached.loadFailed || listUncached.loadFailed) {
    diagnosis.push("listPublicChecks reported loadFailed=true (DB error or missing columns without successful fallback).");
  }
  if (
    probe.connected &&
    (probe.latestPublicCheckCount ?? 0) > 0 &&
    listUncached.rows.length > 0 &&
    listCached.rows.length === 0 &&
    !listCached.loadFailed
  ) {
    diagnosis.push(
      "Uncached query returns rows but cached query is empty — set LATEST_CHECKS_BYPASS_CACHE=true and POST to this endpoint to revalidate, or redeploy."
    );
  }
  if (!probe.canonicalSelectWorks && probe.legacySelectWorks) {
    diagnosis.push(
      "Canonical trust columns missing in DB — running legacy select fallback. Run prisma migrate deploy on this database."
    );
  }
  if (probe.connected && (probe.latestPublicCheckCount ?? 0) > 0) {
    diagnosis.push("Data exists in connected database; if UI is empty, suspect ISR/unstable_cache or wrong Vercel env target.");
  }

  return NextResponse.json({
    db: {
      connected: probe.connected,
      connectionError: probe.connectionError,
      connection: dbConnection
    },
    counts: {
      latestPublicCheck: probe.latestPublicCheckCount,
      scamSignal: probe.scamSignalCount,
      reputationEnrichmentCache: probe.reputationCacheCount
    },
    timestamps: {
      newestLastSeenAt: probe.newestLastSeenAt,
      oldestLastSeenAt: probe.oldestLastSeenAt
    },
    schema: {
      canonicalSelectWorks: probe.canonicalSelectWorks,
      legacySelectWorks: probe.legacySelectWorks
    },
    sampleRows: probe.sampleRows.map((row) => ({
      id: row.id,
      normalizedValue: row.normalizedValue,
      checkedValue: row.checkedValue.slice(0, 120),
      riskScoreSnapshot: row.riskScoreSnapshot,
      statusLabel: row.statusLabel,
      normalizedTrustScore: row.normalizedTrustScore ?? null,
      consumerVerdictLabel: row.consumerVerdictLabel ?? null,
      lastSeenAt: row.lastSeenAt instanceof Date ? row.lastSeenAt.toISOString() : row.lastSeenAt
    })),
    listPublicChecks: {
      cached: {
        rowCount: listCached.rows.length,
        loadFailed: listCached.loadFailed,
        cacheBypassEnv: latestChecksCacheBypassEnabled()
      },
      uncached: {
        rowCount: listUncached.rows.length,
        loadFailed: listUncached.loadFailed
      }
    },
    ui: {
      rowsFilteredByCanonicalRequirement: false,
      rowsSkippedInRender: rowsFilteredInUi,
      note: "listPublicChecks does not filter on normalizedTrustScore or consumerVerdictLabel; NULL canonical columns are supported."
    },
    envFlags: getPublicFeatureFlagsSnapshot(),
    diagnosis,
    recoveryHints: [
      "Verify Vercel Production DATABASE_URL matches the Neon production branch (compare host/branch slug).",
      "If counts are zero on production URL but nonzero locally, restore previous DATABASE_URL and redeploy.",
      "Set LATEST_CHECKS_BYPASS_CACHE=true temporarily, POST ?action=revalidate-cache to bust feed cache.",
      "Run: npx prisma migrate deploy (against production DIRECT_URL or DATABASE_URL)."
    ]
  });
}

export async function POST(request: Request) {
  if (!isAdminRecalcAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get("action")?.trim() ?? "revalidate-cache";

  if (action === "revalidate-cache") {
    try {
      revalidateTag(LATEST_PUBLIC_CHECKS_CACHE_TAG);
      return NextResponse.json({ ok: true, action, tag: LATEST_PUBLIC_CHECKS_CACHE_TAG });
    } catch (error) {
      return NextResponse.json(
        {
          ok: false,
          action,
          error: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
