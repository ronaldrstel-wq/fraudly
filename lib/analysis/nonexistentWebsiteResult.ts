import { mergeReasonsWithHeuristics } from "@/lib/aiScamReasons";
import { buildDomainHeuristicReasons, type ScoreResult } from "@/lib/scoringEngine";
import type { SupplyChainSignals } from "@/lib/supplyChainSignals";
import { EN_MESSAGES } from "@/lib/messages.en";
import type { ExternalChecksResult } from "@/lib/checks/types";
import type { ReviewSignals } from "@/lib/reviewSignals";
import type { ScamCheckResult } from "@/types/scam";
import type { DomainInfrastructure } from "@/types/domain-infrastructure";

const MSG = EN_MESSAGES.specialOutcomes.nonexistent;

/**
 * Dedicated payload when DNS/RDAP show no corroboratable apex — avoids positive trust theatre.
 */
export function buildNonexistentWebsiteResult(params: {
  normalizedDomain: string;
  externalChecks: ExternalChecksResult;
  reviewSignals: ReviewSignals;
  supplyChainSignals: SupplyChainSignals;
  domainInfrastructure: DomainInfrastructure;
  trustSignals: ScamCheckResult["trustSignals"];
  intelScoreBreakdown: ScamCheckResult["intelScoreBreakdown"];
}): ScamCheckResult {
  const riskScore = 94;

  const scoreResult: ScoreResult = {
    baseScore: 16,
    finalScore: riskScore,
    verdict: "scam",
    signals: [],
    topPositiveSignals: [],
    topNegativeSignals: [],
    trustScoreCap: 12,
    trustedBlockedReason: "no_trust_anchor"
  };

  const reasons = mergeReasonsWithHeuristics(null, [
    MSG.reasonLine,
    ...buildDomainHeuristicReasons(params.normalizedDomain),
    ...params.supplyChainSignals.reasons,
    `"${MSG.headline}" · ${MSG.subline}`
  ]);

  return {
    score: riskScore,
    verdict: "scam",
    domain: params.normalizedDomain,
    reasons,
    trustSignals: params.trustSignals,
    providerEvidence: params.externalChecks.providerEvidence,
    intelScoreBreakdown: params.intelScoreBreakdown,
    domainIntelligence: params.externalChecks.domainIntelligence,
    safeBrowsing: params.externalChecks.safeBrowsing,
    openPhish: params.externalChecks.openPhish,
    urlHaus: params.externalChecks.urlHaus,
    ssl: params.externalChecks.ssl,
    police: params.externalChecks.police,
    reviewSignals: params.reviewSignals,
    reviewSummary: MSG.reviewSummary,
    aiUsed: false,
    supplyChainSignals: params.supplyChainSignals,
    scoreResult,
    domainInfrastructure: params.domainInfrastructure,
    siteStatus: "nonexistent",
    confidenceLevel: "high",
    confidenceRationale: MSG.confidenceRationale,
    omitTrustScoreGauge: true,
    behavioralSignalsPending: {}
  };
}
