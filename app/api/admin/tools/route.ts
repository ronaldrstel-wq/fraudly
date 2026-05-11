import { NextResponse } from "next/server";
import { getAdminIdentityOrNull, requireAdmin } from "@/lib/auth/admin";
import {
  clearReputationCacheForDomain,
  forceRefreshReputationForDomain,
  getDomainDebugDetails,
  hideLatestCheckForDomain,
  recalculateRecentLatestChecks,
  recalculateSingleDomain,
  setDomainOverride
} from "@/lib/admin/tools-service";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type ActionBody =
  | { action: "recalculate_recent"; limit?: number }
  | { action: "recalculate_domain"; domain: string }
  | { action: "force_refresh_reputation"; domain: string }
  | { action: "clear_reputation_cache"; domain: string }
  | { action: "hide_latest_check"; domain: string }
  | { action: "set_override"; domain: string; overrideVerdict: "trusted" | "suspicious" | "high_risk" | "none"; note?: string };

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const url = new URL(request.url);
  const domain = (url.searchParams.get("domain") ?? "").trim();
  if (!domain) {
    const latest = await db.latestPublicCheck.findMany({
      orderBy: { lastSeenAt: "desc" },
      take: 50
    });
    return NextResponse.json({ ok: true, latest });
  }
  const debug = await getDomainDebugDetails(domain);
  return NextResponse.json({ ok: true, debug });
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const identity = await getAdminIdentityOrNull();
  const admin = { userId: identity?.userId ?? null, email: identity?.email ?? null };
  const body = (await request.json()) as ActionBody;

  if (body.action === "recalculate_recent") {
    const summary = await recalculateRecentLatestChecks(admin, body.limit ?? 100);
    return NextResponse.json({ ok: true, action: body.action, summary });
  }
  if (body.action === "recalculate_domain") {
    const summary = await recalculateSingleDomain(admin, body.domain);
    return NextResponse.json({ ok: true, action: body.action, summary });
  }
  if (body.action === "force_refresh_reputation") {
    const enrichment = await forceRefreshReputationForDomain(admin, body.domain);
    return NextResponse.json({ ok: true, action: body.action, enrichment });
  }
  if (body.action === "clear_reputation_cache") {
    const deleted = await clearReputationCacheForDomain(admin, body.domain);
    return NextResponse.json({ ok: true, action: body.action, deleted });
  }
  if (body.action === "hide_latest_check") {
    const deleted = await hideLatestCheckForDomain(admin, body.domain);
    return NextResponse.json({ ok: true, action: body.action, deleted });
  }
  if (body.action === "set_override") {
    const override = await setDomainOverride({
      identity: admin,
      domain: body.domain,
      overrideVerdict: body.overrideVerdict,
      note: body.note
    });
    return NextResponse.json({ ok: true, action: body.action, override });
  }
  return NextResponse.json({ error: "invalid_action" }, { status: 400 });
}
