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
import type { ScanProgressState } from "@/types/scam";

export const runtime = "nodejs";

interface CheckRequest {
  url?: string;
  detailLevel?: "basic" | "full";
  language?: "en" | "nl";
  streamProgress?: boolean;
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

function logNonCritical(message: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(message, error);
  }
}

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

    let user: User | null = null;
    try {
      user = await getBillingUserOrNull();
    } catch (e) {
      // Auth/user-store hiccups should not block the core check flow.
      logNonCritical("[api/check] billing user lookup failed; continuing as anonymous:", e);
      user = null;
    }
    const hasUsedAnonFreeCheck = hasUsedAnonymousFreeCheckCookie(request.headers.get("cookie"));

    if (!user) {
      if (!canRunCheck(user, { hasUsedAnonymousFreeCheck: hasUsedAnonFreeCheck })) {
        return NextResponse.json(
          { error: "second_check_requires_signup", message: EN_MESSAGES.auth.loginForAnotherCheck },
          { status: 401 }
        );
      }

      try {
        const ip = getClientIp(request);
        const limitResult = checkDailyLimiter.consume(`anon-free:${ip}`);
        if (!limitResult.allowed) {
          return NextResponse.json(
            { error: "second_check_requires_signup", message: EN_MESSAGES.auth.loginForAnotherCheck },
            { status: 401 }
          );
        }
      } catch (e) {
        // Rate limiter errors are non-critical for correctness of a single scan result.
        logNonCritical("[api/check] rate limiter failed; allowing request:", e);
      }
    }

    const billingUser: User | null = user;

    if (body?.streamProgress === true) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          const push = (obj: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
          void (async () => {
            try {
              const fullResult = await runWebsiteAnalysis(canonicalHref, language, (progress: ScanProgressState) => {
                push({ type: "progress", progress });
              });
              push({
                type: "result",
                payload: {
                  detailLevel: "full" as const,
                  result: fullResult,
                  upsellPremium: false,
                  billing: billingUser ? toBillingSnapshot(billingUser) : ANON_BILLING_SNAPSHOT
                }
              });
            } catch (err) {
              const requestId = globalThis.crypto?.randomUUID?.() ?? `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
              push({
                type: "error",
                payload: {
                  error: "Internal server error",
                  requestId,
                  message: "We couldn’t complete this check right now. Please try again."
                }
              });
            } finally {
              controller.close();
            }
          })();
        }
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "Cache-Control": "no-cache, no-transform"
        }
      });
    }

    const fullResult = await runWebsiteAnalysis(canonicalHref, language);

    if (billingUser?.id) {
      try {
        await tryRecordRecentSearch({
          userId: billingUser.id,
          anonymousSessionKey: null,
          originalUrlInput: userTrimmed,
          analyzedHref: canonicalHref,
          result: fullResult
        });
      } catch (e) {
        // Recent-search persistence should never block the primary website check response.
        logNonCritical("[api/check] recent search persistence skipped:", e);
      }
    }

    try {
      await upsertLatestPublicCheckFromCompletedScan({
        parsedUrl,
        originalInput: userTrimmed,
        result: fullResult
      });
    } catch (e) {
      logNonCritical("[api/check] latest public snapshot skipped:", e);
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
