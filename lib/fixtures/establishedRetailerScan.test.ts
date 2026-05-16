import { describe, expect, it } from "vitest";
import { calculateScamScore } from "@/lib/scoringEngine";
import { buildScoringIdentityContext } from "@/lib/scoringIdentityContext";
import { standardVerdictLabel } from "@/lib/scoring/displayScore";
import { normalizeConsumerSignalsForResult } from "@/lib/signals/normalizeConsumerSignals";
import { normalizeTrustResult } from "@/lib/trust/normalizeTrustResult";
import { extractTrustHighlightFacts } from "@/lib/signals/trustHighlightFacts";
import type { ExternalChecksResult } from "@/lib/checks/types";
import type { ReviewSignals } from "@/lib/reviewSignals";
import type { ScamCheckResult } from "@/types/scam";

/** Established retailer fixture — not domain-specific runtime logic. */
function establishedRetailerFixture(): {
  checks: ExternalChecksResult;
  reviewSignals: ReviewSignals;
  result: Pick<ScamCheckResult, "trustSignals" | "domainIntelligence" | "ssl">;
} {
  const checks: ExternalChecksResult = {
    police: { listedInPoliceScamDatabase: false, source: "test", warnings: [] },
    domainIntelligence: {
      ageDays: 8000,
      registrationDate: "2000-01-01T00:00:00.000Z",
      registrar: "Example Registrar",
      source: "RDAP (test)",
      warnings: []
    },
    safeBrowsing: { safeBrowsingStatus: "safe", safeBrowsingThreats: [], source: "test", warnings: [] },
    openPhish: { listed: false, matches: [], source: "test", warnings: [] },
    urlHaus: { listed: false, matches: [], source: "test", warnings: [] },
    ssl: { httpsEnabled: true, validCertificate: true, source: "test", warnings: [] },
    providerEvidence: [],
    warnings: []
  };

  const reviewSignals: ReviewSignals = {
    googleFound: true,
    googleRating: 4.5,
    googleReviewCount: 5000,
    trustpilotFound: true,
    trustpilotRating: 4.4,
    trustpilotReviewCount: 12000,
    suspiciousReviewSignals: [],
    sources: [],
    warnings: [],
    publicReviewAvailabilityNotes: [],
    reviewFetchDebug: []
  };

  const trustSignals = [
    {
      title: "HTTPS is available",
      type: "positive" as const,
      description: "Valid certificate chain",
      source: "TLS"
    },
    {
      title: "Older domain registration",
      type: "positive" as const,
      description: "Registered for roughly 8000 days",
      source: "RDAP"
    },
    {
      title: "No OpenPhish match found in this snapshot",
      type: "info" as const,
      description: "",
      source: "OpenPhish"
    },
    {
      title: "No URLhaus match found in this snapshot",
      type: "info" as const,
      description: "",
      source: "URLhaus"
    }
  ];

  return {
    checks,
    reviewSignals,
    result: {
      trustSignals,
      domainIntelligence: checks.domainIntelligence,
      ssl: checks.ssl
    }
  };
}

describe("established retailer scan fixture", () => {
  it("surfaces likely-safe consumer signals without contradictions", () => {
    const { checks, reviewSignals, result } = establishedRetailerFixture();
    const ctx = buildScoringIdentityContext("example-retailer.nl", checks, reviewSignals);
    const score = calculateScamScore({
      domain: "example-retailer.nl",
      heuristicReasons: [],
      reviewSignals,
      supplyChainSignals: {
        likelyDropshipping: false,
        likelyChinaShipping: false,
        likelyLocalProduction: false,
        confidence: "low",
        dropshipConfidence: "low",
        chinaConfidence: "low",
        localConfidence: "low",
        reasons: [],
        scoreAdjustment: 0
      },
      websiteText: "Welcome to our shop",
      externalSignals: [],
      scoringContext: ctx,
      intelSurface: { confirmedMalicious: false, benignTechnicalBaseline: true }
    });

    const trustScore = 100 - score.finalScore;
    const verdict = standardVerdictLabel(trustScore);
    const consumer = normalizeConsumerSignalsForResult(result);
    const highlights = extractTrustHighlightFacts(result);

    expect(verdict).toBe("Likely Safe");
    expect(consumer.watch.some((l) => l.includes("appears in known scam"))).toBe(false);
    expect(consumer.helpful.some((l) => l.includes("No matches were found"))).toBe(true);
    expect(highlights.some((h) => h.id === "domain_age" && h.bucket === "positive")).toBe(true);
    expect(highlights.some((h) => h.id === "ssl" && h.bucket === "positive")).toBe(true);
    expect(consumer.helpful.some((l) => l.includes("Domain age could not be verified"))).toBe(false);

    const normalized = normalizeTrustResult({
      score: score.finalScore,
      verdict: score.verdict,
      domain: "example-retailer.nl",
      reasons: [],
      ...result,
      reviewSignals,
      providerEvidence: checks.providerEvidence,
      safeBrowsing: checks.safeBrowsing,
      openPhish: checks.openPhish,
      urlHaus: checks.urlHaus,
      police: checks.police,
      scoreResult: score,
      intelScoreBreakdown: [],
      reviewSummary: "",
      aiUsed: false,
      supplyChainSignals: {
        likelyDropshipping: false,
        likelyChinaShipping: false,
        likelyLocalProduction: false,
        confidence: "low",
        dropshipConfidence: "low",
        chinaConfidence: "low",
        localConfidence: "low",
        reasons: [],
        scoreAdjustment: 0
      },
      domainInfrastructure: { source: "dns", warnings: [] },
      siteStatus: "active",
      confidenceLevel: "medium",
      confidenceRationale: "",
      behavioralSignalsPending: {}
    } as unknown as ScamCheckResult);

    expect(normalized.verdict).toBe("Likely Safe");
    expect(normalized.showLimitedPublicStrip).toBe(false);
    expect(normalized.domainAge.verified).toBe(true);
    expect(normalized.reputation.google.display).not.toBeNull();
  });
});
