import {
  fetchAiScamReasons,
  fetchWebsiteSignals,
  mergeReasonsWithHeuristics,
  type AiScamReasonsResult
} from "@/lib/aiScamReasons";
import { buildNonexistentWebsiteResult } from "@/lib/analysis/nonexistentWebsiteResult";
import { normalizeDomain } from "@/lib/cache";
import { runAllChecks } from "@/lib/checks";
import { buildDomainInfrastructure, probeApexDnsResolution } from "@/lib/domainInfrastructure";
import { buildIntelScoring, buildTrustSignalsFromEvidence } from "@/lib/checks/scoring";
import { getReviewSignals } from "@/lib/reviewSignals";
import { buildScoringIdentityContext } from "@/lib/scoringIdentityContext";
import { computeRatingConfidence } from "@/lib/scoringConfidence";
import {
  buildDomainHeuristicReasons,
  calculateScamScore,
  formatScoreSignalsForPrompt
} from "@/lib/scoringEngine";
import { collectMaliciousSignals, deriveSiteStatus, isProbablyInactiveWebsite } from "@/lib/siteOutcome";
import { getSupplyChainSignals } from "@/lib/supplyChainSignals";
import { EN_MESSAGES } from "@/lib/messages.en";
import type { ScamCheckResult } from "@/types/scam";
import type { PendingPageBehaviorSignals } from "@/types/behavioral-signals";

const EMPTY_BEHAVIOR: PendingPageBehaviorSignals = {};

/**
 * Runs the full website trust analysis (external intel, scoring, optional AI).
 * Used by `/api/check` and public `/check/[domain]` pages (cached); no auth handling here.
 */
export async function runWebsiteAnalysis(inputUrl: string, language: "en" | "nl" = "en"): Promise<ScamCheckResult> {
  const normalizedDomain = normalizeDomain(inputUrl);
  const heuristicReasons = buildDomainHeuristicReasons(normalizedDomain);
  const [reviewSignals, websiteSignals, externalChecks, dnsProbe] = await Promise.all([
    getReviewSignals(normalizedDomain),
    fetchWebsiteSignals(inputUrl),
    runAllChecks(inputUrl),
    probeApexDnsResolution(normalizedDomain)
  ]);
  const dnsResolvable = dnsProbe.ipv4 || dnsProbe.ipv6;

  const domainInfrastructure = buildDomainInfrastructure({
    dnsResolvable,
    domainIntelligence: externalChecks.domainIntelligence,
    ssl: externalChecks.ssl
  });

  if (domainInfrastructure.treatAsNonExistentHost) {
    const supplyChainSignals = await getSupplyChainSignals(normalizedDomain, "");
    const { breakdown: intelScoreBreakdown } = buildIntelScoring(externalChecks);
    return buildNonexistentWebsiteResult({
      normalizedDomain,
      externalChecks,
      reviewSignals,
      supplyChainSignals,
      domainInfrastructure,
      trustSignals: buildTrustSignalsFromEvidence(externalChecks.providerEvidence),
      intelScoreBreakdown
    });
  }

  const websiteText = websiteSignals?.text ?? "";
  const supplyChainSignals = await getSupplyChainSignals(normalizedDomain, websiteText);

  const { scoreSignals: externalScoreSignals, breakdown: intelScoreBreakdown } = buildIntelScoring(externalChecks);
  const trustSignals = buildTrustSignalsFromEvidence(externalChecks.providerEvidence);
  const scoringContext = buildScoringIdentityContext(normalizedDomain, externalChecks, reviewSignals);

  const scoreInputBase = {
    domain: normalizedDomain,
    heuristicReasons,
    reviewSignals,
    supplyChainSignals,
    websiteText,
    externalSignals: externalScoreSignals,
    scoringContext
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
      : EN_MESSAGES.reviewEvidence.noPublicReviewProfile;
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

  const malicious = collectMaliciousSignals(externalChecks);
  const inactiveWebsite = isProbablyInactiveWebsite({
    dnsResolvable,
    treatAsNonexistent: domainInfrastructure.treatAsNonExistentHost,
    websiteSignals,
    ssl: externalChecks.ssl
  });

  const { level: confidenceLevel, rationale: confidenceRationale } = computeRatingConfidence({
    ctx: scoringContext,
    checks: externalChecks,
    reviewSignals,
    websiteTextLength: websiteText.length
  });

  const siteStatus = deriveSiteStatus({
    scoreRisk: scoreResult.finalScore,
    malicious,
    treatAsNonexistent: false,
    inactiveWebsite,
    ctx: scoringContext,
    reviewSignals
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
    scoreResult,
    domainInfrastructure,
    siteStatus,
    confidenceLevel,
    confidenceRationale,
    behavioralSignalsPending: EMPTY_BEHAVIOR
  };
}
