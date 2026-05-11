import { NextResponse } from "next/server";
import { getAdminIdentityOrNull, requireAdmin } from "@/lib/auth/admin";
import { hideLatestCheckForDomain } from "@/lib/admin/tools-service";

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
  console.info("[admin/hide-scan] action", { domain, adminEmail: actor.email });
  const deleted = await hideLatestCheckForDomain(actor, domain);
  return NextResponse.json({ ok: true, deleted });
}
