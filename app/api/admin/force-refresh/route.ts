import { NextResponse } from "next/server";
import { getAdminIdentityOrNull, requireAdmin } from "@/lib/auth/admin";
import { forceRefreshReputationForDomain } from "@/lib/admin/tools-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = (await request.json()) as { domain?: string };
  const domain = body.domain?.trim();
  if (!domain) return NextResponse.json({ error: "domain_required" }, { status: 400 });
  const identity = await getAdminIdentityOrNull();
  const actor = { userId: identity?.userId ?? null, email: identity?.email ?? null };
  console.info("[admin/force-refresh] action", { domain, adminEmail: actor.email });
  const enrichment = await forceRefreshReputationForDomain(actor, domain);
  return NextResponse.json({ ok: true, enrichment });
}
