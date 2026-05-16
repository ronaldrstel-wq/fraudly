import {
  fetchAiScamReasons,
  fetchWebsiteSignals,
  mergeReasonsWithHeuristics,
  type AiScamReasonsResult
} from "@/lib/aiScamReasons";
import { buildNonexistentWebsiteResult } from "@/lib/analysis/nonexistentWebsiteResult";
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
import {
  collectMaliciousSignals,
  deriveSiteStatus,
  isConfirmedMalicious,
  isProbablyInactiveWebsite
} from "@/lib/siteOutcome";
import { getSupplyChainSignals } from "@/lib/supplyChainSignals";
import { EN_MESSAGES } from "@/lib/messages.en";
import { composeTrustEvidenceBundle } from "@/lib/evidence/composeTrustEvidence";
import { hasMeaningfulClientEvidence, type WebsiteAnalysisClientEvidence } from "@/lib/evidence/types";
import { collectDns } from "@/lib/public-intel/dns";
import { requiresCriticalTrustClamp } from "@/lib/scanPresentation";
import { verdictFromAssessment } from "@/lib/trustSystem";
import type { ScamCheckResult } from "@/types/scam";
import type { PendingPageBehaviorSignals } from "@/types/behavioral-signals";
import { logScanPipelineDebug } from "@/lib/analysis/scanPipelineDebug";
import { enrichScamCheckResultDomainAge } from "@/lib/domain/normalizeDomainAge";
import { parseDomainParts } from "@/lib/domain/parseDomain";
import { resolveRedirectChain } from "@/lib/checks/redirectChain";
import type { ScoreSignal } from "@/lib/scoringEngine";
import { wrapEvidence } from "@/lib/checks/providers/shared";

const EMPTY_BEHAVIOR: PendingPageBehaviorSignals = {};

/**
 * Runs the full website trust analysis (external intel, scoring, optional AI).
 * Used by `/api/check` and public `/check/[domain]` pages (cached); no auth handling here.
 */
export async function runWebsiteAnalysis(
  inputUrl: string,
  language: "en" | "nl" = "en",
  options?: { evidence?: WebsiteAnalysisClientEvidence | null }
): Promise<ScamCheckResult> {
  const redirectChain = await resolveRedirectChain(inputUrl);
  const analysisUrl = redirectChain.finalUrl;
  const parsedDomain = parseDomainParts(analysisUrl);
  const normalizedDomain = parsedDomain.normalizedHostname;
  const heuristicReasons = buildDomainHeuristicReasons(normalizedDomain);
  const [reviewSignals, websiteSignals, externalChecks, dnsProbe, dnsMail] = await Promise.all([
    getReviewSignals(normalizedDomain),
    fetchWebsiteSignals(analysisUrl),
    runAllChecks(analysisUrl),
    probeApexDnsResolution(normalizedDomain),
    collectDns(normalizedDomain)
  ]);
  let originalChecks = externalChecks;
  if (redirectChain.crossDomainRedirect && redirectChain.originalUrl !== redirectChain.finalUrl) {
    try {
      originalChecks = await runAllChecks(redirectChain.originalUrl);
    } catch {
      // Keep analysis resilient if original-domain checks fail.
      originalChecks = externalChecks;
    }
  }
  const originalParsed = parseDomainParts(redirectChain.originalUrl);
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

  const { scoreSignals: finalIntelSignals, breakdown: finalIntelBreakdown } = buildIntelScoring(externalChecks);
  const { scoreSignals: originalIntelSignals, breakdown: originalIntelBreakdown } =
    originalChecks === externalChecks ? { scoreSignals: [] as ScoreSignal[], breakdown: [] as typeof finalIntelBreakdown } : buildIntelScoring(originalChecks);
  const redirectSignals: ScoreSignal[] = [];
  const redirectEvidence = [];

  if (redirectChain.redirectCount > 0) {
    redirectEvidence.push(
      wrapEvidence(
        "Fraudly redirect analysis",
        "domain",
        redirectChain.crossDomainRedirect ? "warning" : "info",
        true,
        "Redirect chain detected",
        redirectChain.crossDomainRedirect
          ? "The entered website forwards visitors to a different registrable domain. Fraudly included the final destination in this scan."
          : "The entered website redirects before loading the final page. This appears to remain within the same registrable domain.",
        "high",
        {
          originalUrl: redirectChain.originalUrl,
          finalUrl: redirectChain.finalUrl,
          redirectCount: redirectChain.redirectCount
        }
      )
    );
  }

  if (redirectChain.crossDomainRedirect) {
    redirectSignals.push({
      id: "redirect-cross-domain",
      label: "Redirects to another domain",
      category: "domain",
      impact: 8,
      confidence: "high",
      evidenceTier: "risk_indicator",
      reason: "The entered website forwards visitors to a different domain. The final destination was included in this scan."
    });
    redirectEvidence.push(
      wrapEvidence(
        "Fraudly redirect analysis",
        "domain",
        "warning",
        true,
        "Redirects to another domain",
        "The entered website forwards visitors to a different domain. The final destination was included in this scan.",
        "high"
      )
    );
  }

  if (redirectChain.redirectCount >= 3) {
    redirectSignals.push({
      id: "redirect-long-chain",
      label: "Long redirect chain",
      category: "website_quality",
      impact: 6,
      confidence: "medium",
      evidenceTier: "risk_indicator",
      reason: `The URL followed ${redirectChain.redirectCount} redirects before landing on the final page.`
    });
  }

  if (redirectChain.tooManyRedirects || redirectChain.timedOut) {
    redirectSignals.push({
      id: "redirect-unreliable-chain",
      label: "Redirect destination could not be fully confirmed",
      category: "website_quality",
      impact: 10,
      confidence: "high",
      evidenceTier: "risk_indicator",
      reason: redirectChain.tooManyRedirects
        ? "The URL hit the redirect limit before a stable destination was reached."
        : "Redirect resolution timed out before destination confirmation."
    });
  }

  const originalAge = originalChecks.domainIntelligence.ageDays;
  const finalAge = externalChecks.domainIntelligence.ageDays;
  if (
    redirectChain.crossDomainRedirect &&
    typeof originalAge === "number" &&
    typeof finalAge === "number" &&
    originalAge >= 365 &&
    finalAge <= 60
  ) {
    redirectSignals.push({
      id: "redirect-young-destination",
      label: "Redirect destination is much newer",
      category: "domain",
      impact: 11,
      confidence: "high",
      evidenceTier: "risk_indicator",
      reason: `The entered domain is about ${originalAge} days old, but the final destination is about ${finalAge} days old.`
    });
  }

  const finalHasIntelHits =
    externalChecks.safeBrowsing.safeBrowsingStatus === "flagged" || externalChecks.openPhish.listed || externalChecks.urlHaus.listed;
  if (redirectChain.crossDomainRedirect && finalHasIntelHits) {
    redirectSignals.push({
      id: "redirect-destination-risky",
      label: "Redirect destination may be risky",
      category: "website_quality",
      impact: 18,
      confidence: "high",
      evidenceTier: "confirmed_malicious",
      reason: "The final website after redirect has stronger risk indicators than the entered domain."
    });
    redirectEvidence.push(
      wrapEvidence(
        "Fraudly redirect analysis",
        "phishing",
        "danger",
        true,
        "Redirect destination may be risky",
        "The final website after redirect has stronger risk indicators than the entered domain.",
        "high"
      )
    );
  }

  if (redirectChain.crossDomainRedirect) {
    heuristicReasons.push(
      "This site redirects to another domain, so Fraudly checked the final destination too."
    );
  }

  const intelScoreBreakdown = [...finalIntelBreakdown, ...originalIntelBreakdown];
  const combinedProviderEvidence = [...externalChecks.providerEvidence, ...redirectEvidence];
  const trustSignals = buildTrustSignalsFromEvidence(combinedProviderEvidence);
  const scoringContext = buildScoringIdentityContext(normalizedDomain, externalChecks, reviewSignals);
  const maliciousSignals = collectMaliciousSignals(externalChecks);
  const criticalThreatClamp = requiresCriticalTrustClamp(externalChecks);
  const confirmedMalicious = isConfirmedMalicious(maliciousSignals) || criticalThreatClamp;
  const mailDnsHints = dnsMail.ok && dnsMail.data ? dnsMail.data : null;
  const intelSurface = {
    confirmedMalicious,
    benignTechnicalBaseline: externalChecks.ssl.httpsEnabled && externalChecks.ssl.validCertificate
  };

  const scoreInputBase = {
    domain: normalizedDomain,
    heuristicReasons,
    reviewSignals,
    supplyChainSignals,
    websiteText,
    externalSignals: [...finalIntelSignals, ...originalIntelSignals, ...redirectSignals],
    scoringContext,
    intelSurface,
    mailDnsHints
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
      providerEvidence: combinedProviderEvidence,
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

  let trustEvidence: ScamCheckResult["trustEvidence"] | undefined;
  let adjustedRisk = scoreResult.finalScore;
  const clientEvidence = options?.evidence;
  if (clientEvidence && hasMeaningfulClientEvidence(clientEvidence)) {
    const bundle = composeTrustEvidenceBundle({
      canonicalUrl: inputUrl,
      normalizedDomain,
      websiteText,
      htmlSnippet: websiteSignals?.htmlSnippet,
      domainIntelligence: externalChecks.domainIntelligence,
      evidence: clientEvidence
    });
    if (bundle) {
      trustEvidence = bundle;
      adjustedRisk = Math.round(Math.min(100, Math.max(0, scoreResult.finalScore + bundle.appliedRiskDelta)));
    }
  }

  if (criticalThreatClamp) {
    adjustedRisk = Math.max(adjustedRisk, 80);
  }

  const adjustedVerdict = verdictFromAssessment({
    riskScore: adjustedRisk,
    confirmedMalicious,
    lexicalStrong: scoringContext.domainPatterns.hasStrongLexicalSuspicion
  });
  const adjustedScoreResult = { ...scoreResult, finalScore: adjustedRisk, verdict: adjustedVerdict };

  const scoreLinesFinal = [
    ...scoreResult.topPositiveSignals.map((s) => `Scoring (risk↑): ${s.reason}`),
    ...scoreResult.topNegativeSignals.map((s) => `Scoring (trust↑): ${s.reason}`)
  ];
  const heuristicForMerge = [...heuristicBase, ...scoreLinesFinal];
  const mergedReasons = mergeReasonsWithHeuristics(aiPayload, heuristicForMerge);

  const malicious = maliciousSignals;
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
    scoreRisk: adjustedRisk,
    malicious,
    treatAsNonexistent: false,
    inactiveWebsite,
    ctx: scoringContext,
    reviewSignals,
    tier1Threat: criticalThreatClamp
  });

  const availability = {
    status: websiteSignals?.availability?.status ?? (dnsResolvable ? "limited_inspection" : "unavailable"),
    contentInspectionStatus: websiteSignals?.availability?.contentInspectionStatus ?? "partial",
    methodTried: websiteSignals?.availability?.methodTried ?? "HEAD+GET",
    httpStatus: websiteSignals?.availability?.httpStatus ?? null,
    finalUrl: websiteSignals?.availability?.finalUrl ?? redirectChain.finalUrl ?? null,
    dnsResolved: dnsResolvable,
    tlsOk: externalChecks.ssl.httpsEnabled && externalChecks.ssl.validCertificate,
    timedOut: websiteSignals?.availability?.timedOut ?? false,
    errorCode: websiteSignals?.availability?.errorCode ?? null,
    botProtectionDetected: websiteSignals?.availability?.botProtectionDetected ?? false,
    contentLength: websiteSignals?.availability?.contentLength ?? websiteText.length,
    parserFailure: websiteSignals?.availability?.parserFailure ?? false,
    extractionFailureReason: websiteSignals?.availability?.extractionFailureReason ?? null,
    reason:
      websiteSignals?.availability?.reason ??
      (siteStatus === "inactive"
        ? "Site unavailable: no HTTP response received."
        : "Website responded, but some page details could not be fully inspected during this scan.")
  } as const;

  logScanPipelineDebug({
    submittedUrl: inputUrl,
    externalChecks,
    reviewSignals,
    trustSignals,
    riskScore: adjustedRisk,
    trustScore: Math.max(0, Math.min(100, 100 - adjustedRisk)),
    verdict: adjustedVerdict
  });

  return enrichScamCheckResultDomainAge({
    score: adjustedRisk,
    verdict: adjustedVerdict,
    domain: normalizedDomain,
    registrableDomain: parsedDomain.registrableDomain,
    submittedHostname: parsedDomain.inputHostname || originalParsed.inputHostname || normalizedDomain,
    subdomain: parsedDomain.subdomain,
    isSubdomain: parsedDomain.isSubdomain,
    suspiciousSubdomainTerms: parsedDomain.suspiciousSubdomainTerms,
    reasons: mergedReasons,
    trustSignals,
    providerEvidence: combinedProviderEvidence,
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
    scoreResult: adjustedScoreResult,
    domainInfrastructure,
    siteStatus,
    confidenceLevel,
    confidenceRationale,
    availability,
    behavioralSignalsPending: EMPTY_BEHAVIOR,
    redirectChain,
    ...(trustEvidence ? { trustEvidence } : {})
  });
}
