import type { User } from "@prisma/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { runWebsiteAnalysis } from "@/lib/analysis/runWebsiteAnalysis";
import { toBillingSnapshot } from "@/lib/billing";
import { EN_MESSAGES } from "@/lib/messages.en";
import { canRunCheck, getAnonymousFreeCheckCookieName, hasUsedAnonymousFreeCheckCookie } from "@/lib/accessControl";
import { checkDailyLimiter, getClientIp } from "@/lib/rateLimiter";
import { RECENT_SEARCH_SESSION_COOKIE } from "@/lib/recent-search/constants";
import { sanitizeRecentSessionEcho } from "@/lib/recent-search/session-echo";
import { upsertLatestPublicCheckFromCompletedScan } from "@/lib/latest-public-checks/persist";
import { tryRecordRecentSearch } from "@/lib/recent-search/service";
import { getBillingUserOrNull } from "@/lib/user-store";

export const runtime = "nodejs";

interface CheckRequest {
  url?: string;
  detailLevel?: "basic" | "full";
  language?: "en" | "nl";
  /** Optional UUID echo from anonymous browsers (paired with LocalStorage fallback). Never a user id. */
  recentSessionEcho?: string;
}

const isProd = process.env.NODE_ENV === "production";

const ANON_FREE_CHECK_COOKIE = getAnonymousFreeCheckCookieName();
const ANON_BILLING_SNAPSHOT = {
  plan: "free",
  freeChecksUsed: 1,
  credits: 0,
  monthlyChecksUsed: 0,
  paidChecksCount: 0,
  subscriptionStatus: "inactive"
} as const;

export async function POST(request: Request) {
  try {
    let body: CheckRequest;
    try {
      body = (await request.json()) as CheckRequest;
    } catch {
      return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }

    const input = typeof body?.url === "string" ? body.url.trim() : "";
    const language = body?.language === "nl" ? "nl" : "en";

    if (!input) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(input);
    } catch {
      return NextResponse.json({ error: "invalid url" }, { status: 400 });
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return NextResponse.json({ error: "invalid url" }, { status: 400 });
    }

    const user = await getBillingUserOrNull();
    const hasUsedAnonFreeCheck = hasUsedAnonymousFreeCheckCookie(request.headers.get("cookie"));

    if (!user) {
      if (!canRunCheck(user, { hasUsedAnonymousFreeCheck: hasUsedAnonFreeCheck })) {
        return NextResponse.json(
          { error: "second_check_requires_signup", message: EN_MESSAGES.auth.loginForAnotherCheck },
          { status: 401 }
        );
      }

      const ip = getClientIp(request);
      const limitResult = checkDailyLimiter.consume(`anon-free:${ip}`);
      if (!limitResult.allowed) {
        return NextResponse.json(
          { error: "second_check_requires_signup", message: EN_MESSAGES.auth.loginForAnotherCheck },
          { status: 401 }
        );
      }
    }

    const billingUser: User | null = user;

    const fullResult = await runWebsiteAnalysis(parsedUrl.href, language);

    const jar = await cookies();
    const echoSession = sanitizeRecentSessionEcho(body.recentSessionEcho);
    let anonymousRecentKey: string | null = null;
    if (!billingUser?.id) {
      anonymousRecentKey =
        jar.get(RECENT_SEARCH_SESSION_COOKIE)?.value?.trim() || echoSession || crypto.randomUUID();
    }

    await tryRecordRecentSearch({
      userId: billingUser?.id ?? null,
      anonymousSessionKey: billingUser?.id ? null : anonymousRecentKey,
      originalUrlInput: input,
      analyzedHref: parsedUrl.href,
      result: fullResult
    });

    try {
      await upsertLatestPublicCheckFromCompletedScan({
        parsedUrl,
        originalInput: input,
        result: fullResult
      });
    } catch (e) {
      console.warn("[api/check] latest public snapshot skipped:", e);
    }

    const payload = {
      detailLevel: "full" as const,
      result: fullResult,
      upsellPremium: false,
      billing: billingUser ? toBillingSnapshot(billingUser) : ANON_BILLING_SNAPSHOT
    };

    const response = NextResponse.json(payload);
    if (!billingUser?.id && anonymousRecentKey) {
      response.cookies.set(RECENT_SEARCH_SESSION_COOKIE, anonymousRecentKey, {
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
        path: "/",
        maxAge: 60 * 60 * 24 * 395
      });
    }
    if (!billingUser) {
      response.cookies.set(ANON_FREE_CHECK_COOKIE, "true", {
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
        path: "/",
        maxAge: 60 * 60 * 24 * 30
      });
    }
    return response;
  } catch (err) {
    console.error("[api/check]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
