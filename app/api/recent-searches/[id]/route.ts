import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { RECENT_SEARCH_SESSION_COOKIE } from "@/lib/recent-search/constants";
import { deleteRecentSearchForScope } from "@/lib/recent-search/service";
import { EN_MESSAGES } from "@/lib/messages.en";
import { sanitizeRecentSessionEcho } from "@/lib/recent-search/session-echo";
import { getBillingUserOrNull } from "@/lib/user-store";

type RouteCtx = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, context: RouteCtx) {
  const { id } = await context.params;
  const user = await getBillingUserOrNull();
  const jar = await cookies();
  const cookieAnon = jar.get(RECENT_SEARCH_SESSION_COOKIE)?.value?.trim() || null;
  const headerEcho = sanitizeRecentSessionEcho(_request.headers.get("x-fraudly-recent-echo"));
  const anon = user?.id ? null : cookieAnon || headerEcho;

  const scope = {
    userId: user?.id ?? null,
    anonymousSessionKey: user?.id ? null : anon
  };

  if (!scope.userId && !scope.anonymousSessionKey) {
    return NextResponse.json({ error: "forbidden", message: EN_MESSAGES.recentSearches.needSession }, { status: 403 });
  }

  const ok = await deleteRecentSearchForScope(id.trim(), scope);
  if (!ok) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
