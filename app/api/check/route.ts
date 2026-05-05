import type { User } from "@prisma/client";
import { NextResponse } from "next/server";
import { toBillingSnapshot } from "@/lib/billing";
import {
  fetchAiScamReasons,
  fetchWebsiteSignals,
  mergeReasonsWithHeuristics,
  type AiScamReasonsResult
} from "@/lib/aiScamReasons";
import { normalizeDomain } from "@/lib/cache";
import { getReviewSignals } from "@/lib/reviewSignals";
import { checkDailyLimiter, getClientIp } from "@/lib/rateLimiter";
import {
  buildDomainHeuristicReasons,
  calculateScamScore,
  formatScoreSignalsForPrompt
} from "@/lib/scoringEngine";
import { getSupplyChainSignals } from "@/lib/supplyChainSignals";
import { EN_MESSAGES } from "@/lib/messages.en";
import { canRunCheck, getAnonymousFreeCheckCookieName, hasUsedAnonymousFreeCheckCookie } from "@/lib/accessControl";
import { getBillingUserOrNull } from "@/lib/user-store";
import type { ScamCheckResult } from "@/types/scam";

export const runtime = "nodejs";

interface CheckRequest {
  url?: string;
  detailLevel?: "basic" | "full";
  language?: "en" | "nl";
}

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
    const detailLevel = "full";
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

    const normalizedDomain = normalizeDomain(parsedUrl.href);
    const heuristicReasons = buildDomainHeuristicReasons(normalizedDomain);
    const reviewSignals = await getReviewSignals(normalizedDomain);
    const websiteSignals = await fetchWebsiteSignals(parsedUrl.href);
    const websiteText = websiteSignals?.text ?? "";
    const supplyChainSignals = await getSupplyChainSignals(normalizedDomain, websiteText);

    const scoreInputBase = {
      domain: normalizedDomain,
      heuristicReasons,
      reviewSignals,
      supplyChainSignals,
      websiteText
    };

    const scorePre = calculateScamScore({
      ...scoreInputBase,
      aiRiskSignals: undefined
    });
    const scoringSignalsJson = formatScoreSignalsForPrompt(scorePre.signals);
    const heuristicBase = [...heuristicReasons, ...supplyChainSignals.reasons];
    const scoreLinesPre = [
      ...scorePre.topPositiveSignals.map((s) => `Scoring (risk↑): ${s.reason}`),
      ...scorePre.topNegativeSignals.map((s) => `Scoring (trust↑): ${s.reason}`)
    ];
    const heuristicForOpenAi = [...heuristicBase, ...scoreLinesPre];

    let reviewSummary =
      reviewSignals.trustpilotFound || reviewSignals.googleFound
        ? "Public review data was included in this analysis."
        : "No public review data found yet.";
    let aiUsed = false;
    let aiPayload: AiScamReasonsResult | null = null;

    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("Missing OPENAI_API_KEY in environment variables");
      }

      aiPayload = await fetchAiScamReasons(
        input,
        websiteSignals,
        reviewSignals,
        heuristicForOpenAi,
        scoringSignalsJson,
        language
      );
      if (aiPayload) {
        aiUsed = true;
        if (aiPayload.reviewSummary) {
          reviewSummary = aiPayload.reviewSummary;
        }
      }
    } catch (error) {
      console.error("[OpenAI] failed:", error);
      aiUsed = false;
      aiPayload = null;
    }

    const scoreResult = calculateScamScore({
      ...scoreInputBase,
      aiRiskSignals: aiPayload?.risk ? { level: aiPayload.risk } : undefined
    });

    const scoreLinesFinal = [
      ...scoreResult.topPositiveSignals.map((s) => `Scoring (risk↑): ${s.reason}`),
      ...scoreResult.topNegativeSignals.map((s) => `Scoring (trust↑): ${s.reason}`)
    ];
    const heuristicForMerge = [...heuristicBase, ...scoreLinesFinal];
    const mergedReasons = mergeReasonsWithHeuristics(aiPayload, heuristicForMerge);

    const fullResult: ScamCheckResult = {
      score: scoreResult.finalScore,
      verdict: scoreResult.verdict,
      domain: normalizedDomain,
      reasons: mergedReasons,
      reviewSignals,
      reviewSummary,
      aiUsed,
      supplyChainSignals,
      scoreResult
    };
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
        secure: true,
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
