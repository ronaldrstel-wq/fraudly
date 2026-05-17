import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { isAdminRecalcAuthorized } from "@/lib/admin/adminKeyAuth";
import { getDatabaseConnectionDiagnostics } from "@/lib/db/connectionDiagnostics";
import { getPublicFeatureFlagsSnapshot } from "@/lib/env/publicFeatureFlags";
import { fetchLatestPublicChecksFeedPage } from "@/lib/latest-public-checks/fetchFeedPage";
import { probeLatestChecksDatabase } from "@/lib/latest-public-checks/dbProbe";
import {
  assessLatestCheckRowRenderable,
  normalizeLastSeenAt
} from "@/lib/latest-public-checks/rowRender";
import {
  fetchLatestPublicChecksPage,
  latestChecksCacheBypassEnabled
} from "@/lib/latest-public-checks/listPublicChecks";
import { LATEST_PUBLIC_CHECKS_CACHE_TAG } from "@/lib/trust/cacheTags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

function parsePage(url: URL): number {
  const raw = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.min(raw, 500);
}

async function buildPageDiagnostics(page: number) {
  const skip = (page - 1) * PAGE_SIZE;
  const take = PAGE_SIZE + 1;
  const rawCached = await fetchLatestPublicChecksPage(skip, take, { bypassCache: false });
  const rawUncached = await fetchLatestPublicChecksPage(skip, take, { bypassCache: true });
  const feed = await fetchLatestPublicChecksFeedPage(page, PAGE_SIZE, { bypassCache: true });

  const renderAssessments = rawUncached.rows.map((row) => {
    const assessed = assessLatestCheckRowRenderable(row);
    return {
      id: row.id,
      domain: row.normalizedValue || row.checkedValue,
      renderable: assessed.renderable,
      reason: assessed.reason ?? null,
      detail: assessed.detail ?? null,
      lastSeenAtType: row.lastSeenAt instanceof Date ? "Date" : typeof row.lastSeenAt,
      lastSeenAtNormalized: normalizeLastSeenAt(row.lastSeenAt).toISOString()
    };
  });

  return {
    page,
    pagination: { pageSize: PAGE_SIZE, skip, take },
    cache: {
      enabled: !latestChecksCacheBypassEnabled(),
      bypassEnv: latestChecksCacheBypassEnabled(),
      cacheKey: ["latest-public-checks-page", String(skip), String(take)]
    },
    rawDb: {
      cached: { rowCount: rawCached.rows.length, loadFailed: rawCached.loadFailed },
      uncached: { rowCount: rawUncached.rows.length, loadFailed: rawUncached.loadFailed }
    },
    feed: {
      renderableRowCount: feed.rows.length,
      loadFailed: feed.loadFailed,
      hasNext: feed.hasNext,
      dbRowsScanned: feed.dbRowsScanned,
      skipped: feed.skipped,
      domains: feed.rows.map((r) => r.normalizedValue || r.checkedValue).slice(0, 10)
    },
    renderAssessments: renderAssessments.slice(0, 10)
  };
}

export async function GET(request: Request) {
  if (!isAdminRecalcAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = parsePage(url);
  const pagesParam = url.searchParams.get("pages");
  const pagesToDiagnose = pagesParam
    ? pagesParam
        .split(",")
        .map((p) => Number.parseInt(p.trim(), 10))
        .filter((n) => Number.isFinite(n) && n >= 1 && n <= 500)
        .slice(0, 5)
    : [page];

  const dbConnection = getDatabaseConnectionDiagnostics();
  const probe = await probeLatestChecksDatabase(50);
  const pageDiagnostics = await Promise.all(pagesToDiagnose.map((p) => buildPageDiagnostics(p)));

  const diagnosis: string[] = [];
  if (!dbConnection.configured) diagnosis.push("DATABASE_URL is not set in this runtime.");
  if (probe.connectionError) diagnosis.push(`Database connection failed: ${probe.connectionError}`);

  for (const pd of pageDiagnostics) {
    if (pd.rawDb.uncached.rowCount > 0 && pd.feed.renderableRowCount === 0) {
      diagnosis.push(
        `Page ${pd.page}: ${pd.rawDb.uncached.rowCount} DB rows but 0 renderable — rows fail render (see renderAssessments / skipped).`
      );
    }
    if (pd.rawDb.cached.loadFailed && !pd.rawDb.uncached.loadFailed) {
      diagnosis.push(`Page ${pd.page}: stale cached loadFailed=true — POST revalidate-cache.`);
    }
    const stringDates = pd.renderAssessments.filter((r) => r.lastSeenAtType === "string");
    if (stringDates.length > 0 && pd.renderAssessments.some((r) => !r.renderable)) {
      diagnosis.push(
        `Page ${pd.page}: lastSeenAt deserialized as string from cache — fixed by normalizeLastSeenAt in feedConfidenceStrip.`
      );
    }
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
    newestSample: probe.sampleRows.slice(0, 10).map((row) => ({
      id: row.id,
      normalizedValue: row.normalizedValue,
      riskScoreSnapshot: row.riskScoreSnapshot,
      normalizedTrustScore: row.normalizedTrustScore ?? null,
      consumerVerdictLabel: row.consumerVerdictLabel ?? null,
      lastSeenAt: row.lastSeenAt instanceof Date ? row.lastSeenAt.toISOString() : row.lastSeenAt
    })),
    pageDiagnostics,
    envFlags: getPublicFeatureFlagsSnapshot(),
    diagnosis,
    recoveryHints: [
      "POST ?action=revalidate-cache to bust all latest-checks unstable_cache entries.",
      "Set LATEST_CHECKS_BYPASS_CACHE=true on Production until redeployed with render fixes.",
      "Use ?pages=1,2,3 to compare pagination slices."
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
      revalidatePath("/latest-checks");
      for (let p = 2; p <= 20; p += 1) {
        revalidatePath(`/latest-checks?page=${p}`);
      }
      return NextResponse.json({
        ok: true,
        action,
        tag: LATEST_PUBLIC_CHECKS_CACHE_TAG,
        pathsRevalidated: ["/latest-checks", "/latest-checks?page=2..20"]
      });
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
