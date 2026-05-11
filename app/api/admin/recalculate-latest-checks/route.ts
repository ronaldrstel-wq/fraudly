import { NextResponse } from "next/server";
import { recalculateRecentScans } from "@/lib/admin/recalculate-scans";
import { isCurrentUserAdmin } from "@/lib/auth/isAdmin";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const adminExpected = process.env.ADMIN_RECALC_KEY?.trim();
  const cronExpected = process.env.CRON_SECRET?.trim();
  const adminProvided = request.headers.get("x-admin-key")?.trim() ?? request.headers.get("x-admin-recalc-key")?.trim();
  const cronProvided = request.headers.get("x-cron-secret")?.trim();
  const authBearer = request.headers.get("authorization")?.trim().replace(/^Bearer\s+/i, "");
  const adminValid = Boolean(adminExpected && adminProvided && adminProvided === adminExpected);
  const cronValid = Boolean(
    cronExpected &&
      ((cronProvided && cronProvided === cronExpected) || (authBearer && authBearer === cronExpected))
  );
  return adminValid || cronValid;
}

function parseLimit(url: URL): number {
  const raw = Number.parseInt(url.searchParams.get("limit") ?? "10", 10);
  if (!Number.isFinite(raw) || raw < 1) return 10;
  return Math.min(raw, 100);
}

export async function POST(request: Request) {
  let isAdmin = false;
  try {
    isAdmin = await isCurrentUserAdmin();
  } catch {
    isAdmin = false;
  }
  if (!isAdmin && !isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const limit = parseLimit(new URL(request.url));
  const summary = await recalculateRecentScans({
    limit,
    sinceDays: 30,
    dryRun: false,
    force: true,
    forceLiveRefresh: false
  });

  return NextResponse.json(summary);
}

