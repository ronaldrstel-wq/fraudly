import { NextResponse } from "next/server";
import {
  canRunBasicCheck,
  canViewFullAnalysis,
  consumeFullAnalysisAccess,
  shouldShowPremiumUpsell,
  type BillingUser
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
import { getOrCreateUser, getUserIdFromRequest, saveUser } from "@/lib/user-store";
import type { BasicCheckResult, ScamCheckResult } from "@/types/scam";

export const runtime = "nodejs";

interface CheckRequest {
  url?: string;
  detailLevel?: "basic" | "full";
}

function toBillingSnapshot(user: BillingUser) {
  return {
    plan: user.plan,
    freeChecksUsed: user.freeChecksUsed,
    credits: user.credits,
    monthlyChecksUsed: user.monthlyChecksUsed,
    paidChecksCount: user.paidChecksCount,
    subscriptionStatus: user.subscriptionStatus
  } as const;
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
    const detailLevel = body?.detailLevel === "full" ? "full" : "basic";

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

    const userId = getUserIdFromRequest(request);
    let user = await getOrCreateUser(userId);

    if (!canRunBasicCheck(user)) {
      return NextResponse.json({ error: "free_limit_reached", billing: toBillingSnapshot(user) }, { status: 402 });
    }

    if (detailLevel === "full" && !canViewFullAnalysis(user)) {
      return NextResponse.json({ error: "full_analysis_locked", billing: toBillingSnapshot(user) }, { status: 402 });
    }

    if (detailLevel === "basic" && user.plan === "free" && user.credits <= 0) {
      const ip = getClientIp(request);
      const limitResult = checkDailyLimiter.consume(ip);
      if (!limitResult.allowed) {
        return NextResponse.json({ error: "free_limit_reached", billing: toBillingSnapshot(user) }, { status: 402 });
      }
      user = await saveUser({ ...user, freeChecksUsed: user.freeChecksUsed + 1 });
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
        scoringSignalsJson
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

    if (detailLevel === "full") {
      user = await saveUser(consumeFullAnalysisAccess(user));
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
    return NextResponse.json({
      detailLevel,
      result: detailLevel === "full" ? fullResult : basicResult,
      upsellPremium: shouldShowPremiumUpsell(user),
      billing: toBillingSnapshot(user)
    });
  } catch (err) {
    console.error("[api/check]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
