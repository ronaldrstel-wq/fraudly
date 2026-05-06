import { type NextRequest, NextResponse } from "next/server";
import { deleteRecentSearchForScope } from "@/lib/recent-search/service";
import { EN_MESSAGES } from "@/lib/messages.en";
import { getBillingUserOrNull } from "@/lib/user-store";

type RouteCtx = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, context: RouteCtx) {
  const { id } = await context.params;
  const user = await getBillingUserOrNull();
  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", message: EN_MESSAGES.auth.loginForAccount },
      { status: 401 }
    );
  }

  const scope = {
    userId: user.id,
    anonymousSessionKey: null
  };

  const ok = await deleteRecentSearchForScope(id.trim(), scope);
  if (!ok) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
