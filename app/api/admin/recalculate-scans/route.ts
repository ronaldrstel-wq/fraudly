import { NextResponse } from "next/server";
import { recalculateRecentScans } from "@/lib/admin/recalculate-scans";
import { isCurrentUserAdmin } from "@/lib/auth/isAdmin";

export const runtime = "nodejs";

type Body = {
  limit?: number;
  sinceDays?: number;
  dryRun?: boolean;
  force?: boolean;
  forceLiveRefresh?: boolean;
};

function hasValidSecret(request: Request): boolean {
  const adminExpected = process.env.ADMIN_RECALC_KEY?.trim();
  const cronExpected = process.env.CRON_SECRET?.trim();
  const adminProvided = request.headers.get("x-admin-recalc-key")?.trim() ?? request.headers.get("x-admin-key")?.trim();
  const cronProvided = request.headers.get("x-cron-secret")?.trim();
  const authBearer = request.headers.get("authorization")?.trim().replace(/^Bearer\s+/i, "");
  const adminValid = Boolean(adminExpected && adminProvided && adminProvided === adminExpected);
  const cronValid = Boolean(
    cronExpected &&
      ((cronProvided && cronProvided === cronExpected) || (authBearer && authBearer === cronExpected))
  );
  return adminValid || cronValid;
}

export async function POST(request: Request) {
  let isAdmin = false;
  try {
    isAdmin = await isCurrentUserAdmin();
  } catch {
    isAdmin = false;
  }
  if (!isAdmin && !hasValidSecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  const summary = await recalculateRecentScans({
    limit: body.limit,
    sinceDays: body.sinceDays,
    dryRun: body.dryRun,
    force: body.force,
    forceLiveRefresh: body.forceLiveRefresh
  });

  return NextResponse.json(summary);
}
