import { type NextRequest, NextResponse } from "next/server";
import { EN_MESSAGES } from "@/lib/messages.en";
import { listRecentSearchesForScope } from "@/lib/recent-search/service";
import { getBillingUserOrNull } from "@/lib/user-store";

/** Signed-in users only — not exposed on the public site. */
export async function GET(_request: NextRequest) {
  try {
    const user = await getBillingUserOrNull();
    if (!user) {
      return NextResponse.json(
        { error: "unauthorized", message: EN_MESSAGES.auth.loginForAccount, items: [] },
        { status: 401 }
      );
    }

    const items = await listRecentSearchesForScope({
      userId: user.id,
      anonymousSessionKey: null
    });

    return NextResponse.json({ items });
  } catch (e) {
    console.error("[recent-searches GET]", e);
    return NextResponse.json({ error: "server_error", items: [] }, { status: 500 });
  }
}
