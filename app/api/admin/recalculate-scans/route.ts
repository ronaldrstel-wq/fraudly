import { NextResponse } from "next/server";
import { recalculateRecentScans } from "@/lib/admin/recalculate-scans";
import { requireAdmin } from "@/lib/auth/admin";

export const runtime = "nodejs";

type Body = {
  limit?: number;
  sinceDays?: number;
  dryRun?: boolean;
  force?: boolean;
  forceLiveRefresh?: boolean;
};

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  console.info("[admin/recalculate-scans] admin route access granted");

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
