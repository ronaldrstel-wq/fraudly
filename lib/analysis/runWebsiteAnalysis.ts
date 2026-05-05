import {
  fetchAiScamReasons,
  fetchWebsiteSignals,
  mergeReasonsWithHeuristics,
  type AiScamReasonsResult
} from "@/lib/aiScamReasons";
import { normalizeDomain } from "@/lib/cache";
import { runAllChecks } from "@/lib/checks";
import { buildScoreSignalsFromChecks, buildTrustSignalsFromChecks } from "@/lib/checks/scoring";
import { getReviewSignals } from "@/lib/reviewSignals";
import {
  buildDomainHeuristicReasons,
  calculateScamScore,
  formatScoreSignalsForPrompt
} from "@/lib/scoringEngine";
import { getSupplyChainSignals } from "@/lib/supplyChainSignals";
import type { ScamCheckResult } from "@/types/scam";

/**
 * Runs the full website trust analysis (external intel, scoring, optional AI).
 * Used by `/api/check` and public `/check/[domain]` pages (cached); no auth handling here.
 */
export async function runWebsiteAnalysis(inputUrl: string, language: "en" | "nl" = "en"): Promise<ScamCheckResult> {
  const normalizedDomain = normalizeDomain(inputUrl);
  const heuristicReasons = buildDomainHeuristicReasons(normalizedDomain);
  const reviewSignals = await getReviewSignals(normalizedDomain);
  const websiteSignals = await fetchWebsiteSignals(inputUrl);
  const websiteText = websiteSignals?.text ?? "";
  const supplyChainSignals = await getSupplyChainSignals(normalizedDomain, websiteText);
  const externalChecks = await runAllChecks(inputUrl);
  const trustSignals = buildTrustSignalsFromChecks(externalChecks);
  const externalScoreSignals = buildScoreSignalsFromChecks(externalChecks);

  const scoreInputBase = {
    domain: normalizedDomain,
    heuristicReasons,
    reviewSignals,
    supplyChainSignals,
    websiteText,
    externalSignals: externalScoreSignals
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
  const trustIntelJson = JSON.stringify(
    {
      police: externalChecks.police,
      domainIntelligence: externalChecks.domainIntelligence,
      safeBrowsing: externalChecks.safeBrowsing,
      openPhish: externalChecks.openPhish,
      urlHaus: externalChecks.urlHaus,
      ssl: externalChecks.ssl,
      trustSignals
    },
    null,
    2
  );

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
      inputUrl,
      websiteSignals,
      reviewSignals,
      heuristicForOpenAi,
      scoringSignalsJson,
      trustIntelJson,
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

  return {
    score: scoreResult.finalScore,
    verdict: scoreResult.verdict,
    domain: normalizedDomain,
    reasons: mergedReasons,
    trustSignals,
    domainIntelligence: externalChecks.domainIntelligence,
    safeBrowsing: externalChecks.safeBrowsing,
    openPhish: externalChecks.openPhish,
    urlHaus: externalChecks.urlHaus,
    ssl: externalChecks.ssl,
    police: externalChecks.police,
    reviewSignals,
    reviewSummary,
    aiUsed,
    supplyChainSignals,
    scoreResult
  };
}
