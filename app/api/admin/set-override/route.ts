import type { DomainOverrideVerdict } from "@prisma/client";
import { NextResponse } from "next/server";
import { getAdminIdentityOrNull, requireAdmin } from "@/lib/auth/admin";
import { setDomainOverride } from "@/lib/admin/tools-service";

export const runtime = "nodejs";

const allowed = new Set<DomainOverrideVerdict>(["trusted", "suspicious", "high_risk", "none"]);

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = (await request.json()) as {
    domain?: string;
    overrideVerdict?: DomainOverrideVerdict;
    note?: string | null;
  };
  const domain = body.domain?.trim();
  if (!domain) return NextResponse.json({ error: "domain_required" }, { status: 400 });
  const overrideVerdict = body.overrideVerdict;
  if (!overrideVerdict || !allowed.has(overrideVerdict)) {
    return NextResponse.json({ error: "invalid_override" }, { status: 400 });
  }
  const identity = await getAdminIdentityOrNull();
  const actor = { userId: identity?.userId ?? null, email: identity?.email ?? null };
  console.info("[admin/set-override] action", { domain, overrideVerdict, adminEmail: actor.email });
  const row = await setDomainOverride({ identity: actor, domain, overrideVerdict, note: body.note });
  return NextResponse.json({ ok: true, override: row });
}
