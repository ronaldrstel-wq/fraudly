import type { User } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  canRunBasicCheck,
  canViewFullAnalysis,
  consumeFullAnalysisAccess,
  shouldShowPremiumUpsell,
  toBillingSnapshot
} from "@/lib/billing";
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
import { getBillingUserOrNull, saveUser } from "@/lib/user-store";
import type { BasicCheckResult, ScamCheckResult } from "@/types/scam";

export const runtime = "nodejs";

interface CheckRequest {
  url?: string;
  detailLevel?: "basic" | "full";
  language?: "en" | "nl";
}

const ANON_FREE_CHECK_COOKIE = "fraudly_free_check_used";
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
    const detailLevel = body?.detailLevel === "full" ? "full" : "basic";
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
    const hasUsedAnonFreeCheck = request.headers.get("cookie")?.includes(`${ANON_FREE_CHECK_COOKIE}=1`) ?? false;

    if (!user) {
      if (detailLevel !== "basic") {
        return NextResponse.json(
          { error: "unauthorized", message: EN_MESSAGES.auth.loginForFullAnalysis },
          { status: 401 }
        );
      }
      if (hasUsedAnonFreeCheck) {
        return NextResponse.json(
          { error: "unauthorized", message: EN_MESSAGES.auth.loginForAnotherCheck },
          { status: 401 }
        );
      }
    }

    let billingUser: User | null = user;

    if (billingUser) {
      if (!canRunBasicCheck(billingUser)) {
        return NextResponse.json({ error: "free_limit_reached", billing: toBillingSnapshot(billingUser) }, { status: 402 });
      }

      if (detailLevel === "full" && !canViewFullAnalysis(billingUser)) {
        return NextResponse.json({ error: "full_analysis_locked", billing: toBillingSnapshot(billingUser) }, { status: 402 });
      }

      if (detailLevel === "basic" && billingUser.plan === "free" && billingUser.credits <= 0) {
        const ip = getClientIp(request);
        const limitResult = checkDailyLimiter.consume(ip);
        if (!limitResult.allowed) {
          return NextResponse.json({ error: "free_limit_reached", billing: toBillingSnapshot(billingUser) }, { status: 402 });
        }
        billingUser = await saveUser({ ...billingUser, freeChecksUsed: billingUser.freeChecksUsed + 1 });
      }
    }

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

    if (detailLevel === "full" && billingUser) {
      billingUser = await saveUser(consumeFullAnalysisAccess(billingUser));
    }

    const basicResult: BasicCheckResult = {
      score: scoreResult.finalScore,
      verdict: scoreResult.verdict,
      domain: normalizedDomain
    };

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
      detailLevel,
      result: detailLevel === "full" ? fullResult : basicResult,
      upsellPremium: billingUser ? shouldShowPremiumUpsell(billingUser) : false,
      billing: billingUser ? toBillingSnapshot(billingUser) : ANON_BILLING_SNAPSHOT
    };

    const response = NextResponse.json(payload);
    if (!billingUser && detailLevel === "basic") {
      response.cookies.set(ANON_FREE_CHECK_COOKIE, "1", {
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
