import { NextResponse } from "next/server";
import { fetchAiScamReasons, fetchWebsiteSignals, mergeReasonsWithHeuristics } from "@/lib/aiScamReasons";
import { getReviewSignals } from "@/lib/reviewSignals";
import { checkDailyLimiter, getClientIp } from "@/lib/rateLimiter";
import {
  buildDomainHeuristicReasons,
  calculateScamScore,
  formatScoreSignalsForPrompt
} from "@/lib/scoringEngine";
import { getSupplyChainSignals } from "@/lib/supplyChainSignals";
import type { ScamCheckResult } from "@/types/scam";

export const runtime = "nodejs";

interface CheckRequest {
  url?: string;
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

    const ip = getClientIp(request);
    const limitResult = checkDailyLimiter.consume(ip);
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: "Daily free check limit reached", limit: limitResult.limit },
        { status: 429 }
      );
    }

    const domain = parsedUrl.hostname.toLowerCase();
    const heuristicReasons = buildDomainHeuristicReasons(domain);
    const reviewSignals = await getReviewSignals(domain);
    const websiteSignals = await fetchWebsiteSignals(parsedUrl.origin);
    const websiteText = websiteSignals?.text ?? "";
    const supplyChainSignals = await getSupplyChainSignals(domain, websiteText);

    const scoreResult = calculateScamScore({
      domain,
      heuristicReasons,
      reviewSignals,
      supplyChainSignals,
      websiteText
    });

    const scoreSignalLines = [
      ...scoreResult.topPositiveSignals.map((s) => `Scoring (risk↑): ${s.reason}`),
      ...scoreResult.topNegativeSignals.map((s) => `Scoring (trust↑): ${s.reason}`)
    ];
    const heuristicForAi = [...heuristicReasons, ...supplyChainSignals.reasons, ...scoreSignalLines];
    const scoringSignalsJson = formatScoreSignalsForPrompt(scoreResult.signals);

    console.log("[Env keys]", Object.keys(process.env).filter((k) => k.includes("OPENAI")));
    console.log("[OpenAI] key exists:", Boolean(process.env.OPENAI_API_KEY));

    let mergedReasons = mergeReasonsWithHeuristics(null, heuristicForAi);
    let reviewSummary =
      reviewSignals.trustpilotFound || reviewSignals.googleFound
        ? "Public review data was included in this analysis."
        : "No public review data found yet.";
    let aiUsed = false;

    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("Missing OPENAI_API_KEY in environment variables");
      }

      console.log("[OpenAI] calling model...");
      const ai = await fetchAiScamReasons(
        input,
        websiteSignals,
        reviewSignals,
        heuristicForAi,
        scoringSignalsJson
      );
      if (ai) {
        console.log("[OpenAI] response received");
        mergedReasons = mergeReasonsWithHeuristics(ai, heuristicForAi);
        if (ai.reviewSummary) {
          reviewSummary = ai.reviewSummary;
        }
        aiUsed = true;
      }
    } catch (error) {
      console.error("[OpenAI] failed:", error);
      mergedReasons = mergeReasonsWithHeuristics(null, heuristicForAi);
      aiUsed = false;
    }

    const result: ScamCheckResult = {
      score: scoreResult.finalScore,
      verdict: scoreResult.verdict,
      domain,
      reasons: mergedReasons,
      reviewSignals,
      reviewSummary,
      aiUsed,
      supplyChainSignals,
      scoreResult
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/check]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
