import { NextResponse } from "next/server";
import { fetchAiScamReasons, fetchWebsiteSignals, mergeReasonsWithHeuristics } from "@/lib/aiScamReasons";
import { getReviewSignals } from "@/lib/reviewSignals";
import { checkDailyLimiter, getClientIp } from "@/lib/rateLimiter";
import type { ScamCheckResult, ScamVerdict } from "@/types/scam";

export const runtime = "nodejs";

interface CheckRequest {
  url?: string;
}

function toVerdict(score: number): ScamVerdict {
  if (score > 70) return "scam";
  if (score > 30) return "suspicious";
  return "safe";
}

function runHeuristics(parsedUrl: URL): { score: number; domain: string; heuristicReasons: string[] } {
  const domain = parsedUrl.hostname.toLowerCase();
  const reasons: string[] = [];
  let score = 15;

  const riskyKeywords = ["cheap", "free", "deal"];
  const matchedKeywords = riskyKeywords.filter((word) => domain.includes(word));

  if (matchedKeywords.length > 0) {
    score += 35;
    reasons.push(`Domain includes suspicious sales keywords: ${matchedKeywords.join(", ")}.`);
  } else {
    reasons.push("No common bait keywords were found in the domain.");
  }

  if (domain.length > 20) {
    score += 30;
    reasons.push("The domain name is unusually long, a common phishing pattern.");
  } else {
    reasons.push("Domain length looks normal.");
  }

  if (domain.split(".").length > 3) {
    score += 15;
    reasons.push("Multiple subdomains detected, which can be used to imitate trusted brands.");
  }

  score = Math.max(0, Math.min(100, score));
  return { score, domain, heuristicReasons: reasons.slice(0, 3) };
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

    const { score, domain, heuristicReasons } = runHeuristics(parsedUrl);
    const reviewSignals = await getReviewSignals(domain);
    console.log("[Env keys]", Object.keys(process.env).filter((k) => k.includes("OPENAI")));
    console.log("[OpenAI] key exists:", Boolean(process.env.OPENAI_API_KEY));

    let mergedReasons = heuristicReasons;
    let reviewSummary = reviewSignals.trustpilotFound
      ? "Public review data was included in this analysis."
      : "No public review data found yet.";
    let aiUsed = false;

    try {
      const signals = await fetchWebsiteSignals(parsedUrl.origin);
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("Missing OPENAI_API_KEY in environment variables");
      }

      console.log("[OpenAI] calling model...");
      const ai = await fetchAiScamReasons(input, signals, reviewSignals, heuristicReasons);
      if (ai) {
        console.log("[OpenAI] response received");
        mergedReasons = mergeReasonsWithHeuristics(ai, heuristicReasons);
        if (ai.reviewSummary) {
          reviewSummary = ai.reviewSummary;
        }
        aiUsed = true;
      }
    } catch (error) {
      console.error("[OpenAI] failed:", error);
      mergedReasons = heuristicReasons;
      aiUsed = false;
    }

    const result: ScamCheckResult = {
      score,
      verdict: toVerdict(score),
      domain,
      reasons: mergedReasons,
      reviewSignals,
      reviewSummary,
      aiUsed
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/check]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
