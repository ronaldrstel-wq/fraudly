import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { RECENT_SEARCH_SESSION_COOKIE } from "@/lib/recent-search/constants";
import { deleteAllRecentSearchesForScope, validateClearAllBody } from "@/lib/recent-search/service";
import { EN_MESSAGES } from "@/lib/messages.en";
import { sanitizeRecentSessionEcho } from "@/lib/recent-search/session-echo";
import { getBillingUserOrNull } from "@/lib/user-store";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (!validateClearAllBody(body)) {
    return NextResponse.json({ error: "bad_request", message: EN_MESSAGES.recentSearches.invalidClearConfirm }, { status: 400 });
  }

  const user = await getBillingUserOrNull();
  const jar = await cookies();
  const cookieAnon = jar.get(RECENT_SEARCH_SESSION_COOKIE)?.value?.trim() || null;
  const headerEcho = sanitizeRecentSessionEcho(request.headers.get("x-fraudly-recent-echo"));
  const anon = user?.id ? null : cookieAnon || headerEcho;

  const scope = {
    userId: user?.id ?? null,
    anonymousSessionKey: user?.id ? null : anon
  };

  if (!scope.userId && !scope.anonymousSessionKey) {
    return NextResponse.json({ error: "forbidden", message: EN_MESSAGES.recentSearches.needSession }, { status: 403 });
  }

  try {
    const removed = await deleteAllRecentSearchesForScope(scope);
    return NextResponse.json({ ok: true, removed });
  } catch (e) {
    console.error("[recent-searches clear]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
