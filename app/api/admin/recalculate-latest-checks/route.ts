import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicStatusLabelForVerdict } from "@/lib/latest-public-checks/status-label";
import { runWebsiteAnalysis } from "@/lib/analysis/runWebsiteAnalysis";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const expected = process.env.ADMIN_RECALC_KEY?.trim();
  if (!expected) return false;
  const provided = request.headers.get("x-admin-key")?.trim();
  return Boolean(provided) && provided === expected;
}

function parseLimit(url: URL): number {
  const raw = Number.parseInt(url.searchParams.get("limit") ?? "10", 10);
  if (!Number.isFinite(raw) || raw < 1) return 10;
  return Math.min(raw, 100);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const limit = parseLimit(new URL(request.url));
  const rows = await db.latestPublicCheck.findMany({
    orderBy: { lastSeenAt: "desc" },
    take: limit
  });

  const updated: Array<{ id: string; normalizedValue: string; riskScoreSnapshot: number; statusLabel: string }> = [];
  const failed: Array<{ id: string; normalizedValue: string; reason: string }> = [];

  for (const row of rows) {
    try {
      const result = await runWebsiteAnalysis(row.normalizedValue, "en");
      const risk = Math.round(
        Number.isFinite(result.score)
          ? Math.min(100, Math.max(0, result.score))
          : 35
      );
      const statusLabel = publicStatusLabelForVerdict(result.verdict);
      await db.latestPublicCheck.update({
        where: { id: row.id },
        data: {
          riskScoreSnapshot: risk,
          statusLabel,
          publicResultPath: `/check/${encodeURIComponent(result.domain)}`
        }
      });

      updated.push({
        id: row.id,
        normalizedValue: row.normalizedValue,
        riskScoreSnapshot: risk,
        statusLabel
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Unknown error";
      failed.push({ id: row.id, normalizedValue: row.normalizedValue, reason });
    }
  }

  return NextResponse.json({
    ok: true,
    scanned: rows.length,
    updatedCount: updated.length,
    failedCount: failed.length,
    updated,
    failed
  });
}

