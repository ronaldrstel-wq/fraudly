import {
  fetchAiScamReasons,
  fetchWebsiteSignals,
  mergeReasonsWithHeuristics,
  type AiScamReasonsResult
} from "@/lib/aiScamReasons";
import { normalizeDomain } from "@/lib/cache";
import { runAllChecks } from "@/lib/checks";
import { buildIntelScoring, buildTrustSignalsFromEvidence } from "@/lib/checks/scoring";
import { getReviewSignals } from "@/lib/reviewSignals";
import {
  buildDomainHeuristicReasons,
  calculateScamScore,
  formatScoreSignalsForPrompt
} from "@/lib/scoringEngine";
import { getSupplyChainSignals } from "@/lib/supplyChainSignals";
import type { ScamCheckResult } from "@/types/scam";
import type { ScanProgressState } from "@/types/scam";

/**
 * Runs the full website trust analysis (external intel, scoring, optional AI).
 * Used by `/api/check` and public `/check/[domain]` pages (cached); no auth handling here.
 */
export async function runWebsiteAnalysis(
  inputUrl: string,
  language: "en" | "nl" = "en",
  onProgress?: (state: ScanProgressState) => void
): Promise<ScamCheckResult> {
  const findings: string[] = [];
  const emit = (state: Omit<ScanProgressState, "findings">) => {
    onProgress?.({
      ...state,
      findings: [...findings]
    });
  };

  emit({
    percentage: 0,
    currentStage: "Preparing scan",
    completedStages: [],
    activeStages: ["Initial security scan"],
    confidence: "low",
    assessmentLabel: "Initial assessment"
  });

  const normalizedDomain = normalizeDomain(inputUrl);
  const heuristicReasons = buildDomainHeuristicReasons(normalizedDomain);
  const externalChecks = await runAllChecks(inputUrl);
  if (externalChecks.safeBrowsing.safeBrowsingStatus === "flagged" || externalChecks.openPhish.listed || externalChecks.urlHaus.listed) {
    findings.push("Technical safety issue detected");
  }
  emit({
    percentage: 20,
    currentStage: "Initial security scan complete",
    completedStages: ["Initial security scan"],
    activeStages: ["Website analysis"],
    confidence: "low",
    assessmentLabel: "Initial assessment"
  });

  const websiteSignals = await fetchWebsiteSignals(inputUrl);
  const websiteText = websiteSignals?.text ?? "";
  const supplyChainSignals = await getSupplyChainSignals(normalizedDomain, websiteText);
  if (supplyChainSignals.likelyDropshipping) findings.push("Possible dropshipping indicators found");
  emit({
    percentage: 40,
    currentStage: "Website analysis complete",
    completedStages: ["Initial security scan", "Website analysis"],
    activeStages: ["Reputation analysis"],
    confidence: "medium",
    assessmentLabel: "Refining reputation analysis"
  });

  const reviewSignals = await getReviewSignals(normalizedDomain);
  if (reviewSignals.suspiciousReviewSignals.some((s) => /complaint|refund|shipping|dropship/i.test(s))) {
    findings.push("High complaint volume detected");
  }
  emit({
    percentage: 70,
    currentStage: "Reputation analysis complete",
    completedStages: ["Initial security scan", "Website analysis", "Reputation analysis"],
    activeStages: ["Deep trust investigation"],
    confidence: reviewSignals.outscraper?.available ? "high" : "medium",
    assessmentLabel: "Refining reputation analysis"
  });

  const { scoreSignals: externalScoreSignals, breakdown: intelScoreBreakdown } = buildIntelScoring(externalChecks);
  const trustSignals = buildTrustSignalsFromEvidence(externalChecks.providerEvidence);

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
  if (scorePre.riskLabels.includes("Brand location mismatch")) findings.push("Brand location mismatch detected");
  if (scorePre.riskLabels.includes("Return policy risk")) findings.push("Return policy risk found");
  emit({
    percentage: 90,
    currentStage: "Deep trust investigation complete",
    completedStages: ["Initial security scan", "Website analysis", "Reputation analysis", "Deep trust investigation"],
    activeStages: ["Final scoring and explanation"],
    confidence: scorePre.confidence,
    provisionalRiskScore: scorePre.finalScore,
    assessmentLabel: "Final confidence calculated"
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
      providerEvidence: externalChecks.providerEvidence,
      intelScoreBreakdown,
      supplemental: {
        police: externalChecks.police,
        domainIntelligence: externalChecks.domainIntelligence,
        safeBrowsing: externalChecks.safeBrowsing,
        openPhish: externalChecks.openPhish,
        urlHaus: externalChecks.urlHaus,
        ssl: externalChecks.ssl
      },
      trustSignals
    },
    null,
    2
  );

  let reviewSummary =
    reviewSignals.trustpilotFound || reviewSignals.googleFound
      ? "Public review data was included in this analysis."
      : "No public review data found yet.";
  if (reviewSignals.outscraper?.available) {
    reviewSummary = "Public review data was included in this analysis (including Outscraper Google Reviews signals).";
  } else if (reviewSignals.outscraper && !reviewSignals.outscraper.available) {
    reviewSummary = "Public review data was limited; Outscraper Google Reviews was unavailable in this run.";
  }
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

  emit({
    percentage: 100,
    currentStage: "Final scoring complete",
    completedStages: [
      "Initial security scan",
      "Website analysis",
      "Reputation analysis",
      "Deep trust investigation",
      "Final scoring and explanation"
    ],
    activeStages: [],
    confidence: scoreResult.confidence,
    provisionalRiskScore: scoreResult.finalScore,
    assessmentLabel: "Final confidence calculated"
  });

  return {
    score: scoreResult.finalScore,
    verdict: scoreResult.verdict,
    domain: normalizedDomain,
    reasons: mergedReasons,
    trustSignals,
    providerEvidence: externalChecks.providerEvidence,
    intelScoreBreakdown,
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
