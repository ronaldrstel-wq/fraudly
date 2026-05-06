import type { User } from "@prisma/client";
import { NextResponse } from "next/server";
import { runWebsiteAnalysis } from "@/lib/analysis/runWebsiteAnalysis";
import { toBillingSnapshot } from "@/lib/billing";
import { EN_MESSAGES } from "@/lib/messages.en";
import { canRunCheck, getAnonymousFreeCheckCookieName, hasUsedAnonymousFreeCheckCookie } from "@/lib/accessControl";
import { checkDailyLimiter, getClientIp } from "@/lib/rateLimiter";
import { parseFlexibleWebsiteInput } from "@/lib/check-input/normalizeWebsiteInput";
import { upsertLatestPublicCheckFromCompletedScan } from "@/lib/latest-public-checks/persist";
import { tryRecordRecentSearch } from "@/lib/recent-search/service";
import { getBillingUserOrNull } from "@/lib/user-store";

export const runtime = "nodejs";

interface CheckRequest {
  url?: string;
  detailLevel?: "basic" | "full";
  language?: "en" | "nl";
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

    const parsed = parseFlexibleWebsiteInput(input);
    if (!parsed.ok) {
      return NextResponse.json({ error: "invalid url" }, { status: 400 });
    }

    const parsedUrl = parsed.url;
    const canonicalHref = parsed.canonicalHref;
    const userTrimmed = parsed.userTrimmed;

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

    const fullResult = await runWebsiteAnalysis(canonicalHref, language);

    if (billingUser?.id) {
      await tryRecordRecentSearch({
        userId: billingUser.id,
        anonymousSessionKey: null,
        originalUrlInput: userTrimmed,
        analyzedHref: canonicalHref,
        result: fullResult
      });
    }

    try {
      await upsertLatestPublicCheckFromCompletedScan({
        parsedUrl,
        originalInput: userTrimmed,
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
    const requestId = globalThis.crypto?.randomUUID?.() ?? `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    console.error("[api/check]", { requestId, err });
    return NextResponse.json(
      { error: "Internal server error", requestId, message: "We couldn’t complete this check right now. Please try again." },
      { status: 500 }
    );
  }
}
