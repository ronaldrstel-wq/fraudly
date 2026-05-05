import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { RECENT_SEARCH_SESSION_COOKIE } from "@/lib/recent-search/constants";
import { sanitizeRecentSessionEcho } from "@/lib/recent-search/session-echo";
import { listRecentSearchesForScope } from "@/lib/recent-search/service";
import { getBillingUserOrNull } from "@/lib/user-store";

/**
 * Authenticated lists use the billing user row. Anonymous scopes use httpOnly cookie, with optional
 * `X-Fraudly-Recent-Echo` (UUID only) aligning with LocalStorage fallback when the cookie is absent.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getBillingUserOrNull();
    const jar = await cookies();
    const cookieAnon = jar.get(RECENT_SEARCH_SESSION_COOKIE)?.value?.trim() || null;
    const headerEcho = sanitizeRecentSessionEcho(request.headers.get("x-fraudly-recent-echo"));
    const anon = user?.id ? null : cookieAnon || headerEcho;

    const items = await listRecentSearchesForScope({
      userId: user?.id ?? null,
      anonymousSessionKey: user?.id ? null : anon
    });

    return NextResponse.json({ items });
  } catch (e) {
    console.error("[recent-searches GET]", e);
    return NextResponse.json({ error: "server_error", items: [] }, { status: 500 });
  }
}
