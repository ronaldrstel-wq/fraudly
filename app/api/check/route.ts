import type { User } from "@prisma/client";
import { NextResponse } from "next/server";
import { runWebsiteAnalysis } from "@/lib/analysis/runWebsiteAnalysis";
import { buildPrivacySafeRequestFingerprints, getRateLimitHashPepper } from "@/lib/abuseHash";
import { hasPaidScanEntitlement, toBillingSnapshot } from "@/lib/billing";
import { reserveScanQuotaOrReject } from "@/lib/checkRateLimits";
import { EN_MESSAGES } from "@/lib/messages.en";
import { canRunCheck, getAnonymousFreeCheckCookieName, hasUsedAnonymousFreeCheckCookie } from "@/lib/accessControl";
import { checkDailyLimiter, getClientIp } from "@/lib/rateLimiter";
import { parseFlexibleWebsiteInput } from "@/lib/check-input/normalizeWebsiteInput";
import { upsertLatestPublicCheckFromCompletedScan } from "@/lib/latest-public-checks/persist";
import { tryRecordRecentSearch } from "@/lib/recent-search/service";
import { getBillingUserOrNull } from "@/lib/user-store";
import { persistScanEvidenceRows } from "@/lib/evidence/persistScanEvidence";
import type { WebsiteAnalysisClientEvidence } from "@/lib/evidence/types";
import { getAdminIdentityOrNull, isCurrentUserAdmin } from "@/lib/auth/isAdmin";

export const runtime = "nodejs";

interface CheckRequest {
  url?: string;
  /** `"basic"` runs the same pipeline today but is classified for quota; `"full"` counts as a deep scan. */
  detailLevel?: "basic" | "full";
  language?: "en" | "nl";
  /** Optional screenshot / ad context (never raw image bytes). */
  evidence?: unknown;
}

function sanitizeClientEvidence(raw: unknown): WebsiteAnalysisClientEvidence | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const out: WebsiteAnalysisClientEvidence = {};

  if (typeof o.adText === "string") {
    const t = o.adText.trim();
    if (t) out.adText = t.slice(0, 8000);
  }
  if (typeof o.sourcePlatform === "string") {
    const p = o.sourcePlatform.trim().toLowerCase();
    if (p) out.sourcePlatform = p.slice(0, 64);
  }

  if (o.imageAnalysis && typeof o.imageAnalysis === "object") {
    const im = o.imageAnalysis as Record<string, unknown>;
    if (typeof im.imageHash === "string" && /^[a-f0-9]{64}$/i.test(im.imageHash.trim())) {
      out.imageAnalysis = {
        imageHash: im.imageHash.trim().toLowerCase(),
        detectedText: typeof im.detectedText === "string" ? im.detectedText.trim().slice(0, 2000) : null,
        extractedSignals:
          typeof im.extractedSignals === "object" && im.extractedSignals !== null && !Array.isArray(im.extractedSignals)
            ? (im.extractedSignals as Record<string, unknown>)
            : null,
        summary: typeof im.summary === "string" ? im.summary.trim().slice(0, 2000) : null,
        riskDelta: typeof im.riskDelta === "number" && Number.isFinite(im.riskDelta) ? Math.round(im.riskDelta) : undefined,
        fallbackMessage: typeof im.fallbackMessage === "string" ? im.fallbackMessage.trim().slice(0, 500) : null,
        aiUsed: im.aiUsed === true
      };
    }
  }

  if (!out.adText && !out.sourcePlatform && !out.imageAnalysis) return undefined;
  return out;
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
const ADMIN_BILLING_SNAPSHOT = {
  plan: "premium",
  freeChecksUsed: 0,
  credits: 9999,
  monthlyChecksUsed: 0,
  paidChecksCount: 9999,
  subscriptionStatus: "active"
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
    const scanKind = body?.detailLevel === "basic" ? ("basic" as const) : ("deep" as const);

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
    const domainKey = parsedUrl.hostname.slice(0, 512);

    let adminIdentity: Awaited<ReturnType<typeof getAdminIdentityOrNull>> = null;
    let isAdmin = false;
    try {
      adminIdentity = await getAdminIdentityOrNull();
      isAdmin = await isCurrentUserAdmin();
    } catch (e) {
      logNonCritical("[api/check] admin lookup failed; continuing without admin bypass:", e);
      adminIdentity = null;
      isAdmin = false;
    }
    let billingUser: User | null = null;
    try {
      billingUser = await getBillingUserOrNull();
    } catch (e) {
      // Auth/user-store hiccups should not block the core check flow.
      logNonCritical("[api/check] billing user lookup failed; continuing as anonymous:", e);
      billingUser = null;
    }
    const hasUsedAnonFreeCheck = hasUsedAnonymousFreeCheckCookie(request.headers.get("cookie"));

    if (!billingUser && !isAdmin) {
      if (!canRunCheck(billingUser, { hasUsedAnonymousFreeCheck: hasUsedAnonFreeCheck })) {
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

    let pepper: string;
    try {
      pepper = getRateLimitHashPepper();
    } catch (err) {
      console.error("[api/check] RATE_LIMIT_HASH_SECRET missing or too short", err);
      return NextResponse.json(
        {
          error: "rate_limit_misconfigured",
          message: "This service is temporarily unavailable. Please try again later."
        },
        { status: 503 }
      );
    }

    const clientIpRaw = getClientIp(request);
    const { ipHash, userAgentHash, abuseKey } = buildPrivacySafeRequestFingerprints(pepper, request, clientIpRaw);
    const paid = isAdmin ? true : billingUser ? hasPaidScanEntitlement(billingUser) : false;

    if (!isAdmin) {
      const quota = await reserveScanQuotaOrReject({
        userId: billingUser?.id ?? null,
        domain: domainKey,
        scanType: scanKind,
        ipHash,
        userAgentHash,
        abuseKey,
        authenticated: Boolean(billingUser?.id),
        paid
      });

      if (!quota.ok) {
        return NextResponse.json(
          { error: "rate_limited", reason: quota.reason, message: quota.message },
          { status: 429 }
        );
      }
    } else {
      console.info("[api/check] admin bypass", {
        adminUserId: adminIdentity?.userId ?? null,
        bypasses: ["rate_limits", "daily_limits", "deep_scan_limits", "paywall"],
        domain: domainKey
      });
    }

    const sanitizedEvidence = sanitizeClientEvidence(body.evidence);
    const fullResult = sanitizedEvidence
      ? await runWebsiteAnalysis(canonicalHref, language, { evidence: sanitizedEvidence })
      : await runWebsiteAnalysis(canonicalHref, language);

    if (sanitizedEvidence && fullResult.trustEvidence) {
      void persistScanEvidenceRows({
        url: canonicalHref,
        evidence: sanitizedEvidence,
        bundle: fullResult.trustEvidence
      });
    }

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
      billing: isAdmin ? ADMIN_BILLING_SNAPSHOT : billingUser ? toBillingSnapshot(billingUser) : ANON_BILLING_SNAPSHOT
    };

    const response = NextResponse.json(payload);
    if (!billingUser && !isAdmin) {
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
