import { describe, expect, it } from "vitest";
import {
  buildCanonicalTrustFieldsFromResult,
  resolveCanonicalFromPersistedColumns
} from "@/lib/trust/resolveCanonicalDisplay";
import { calculateScamScore } from "@/lib/scoringEngine";
import { buildScoringIdentityContext } from "@/lib/scoringIdentityContext";
import type { ExternalChecksResult } from "@/lib/checks/types";
import type { ReviewSignals } from "@/lib/reviewSignals";
import { normalizeTrustResult } from "@/lib/trust/normalizeTrustResult";
import { displayLockFromSnapshot } from "@/lib/trust/normalizeTrustResult";
import type { LatestPublicCheckSnapshot } from "@/lib/latest-public-checks/snapshot";

function checks(ageDays: number): ExternalChecksResult {
  return {
    police: { listedInPoliceScamDatabase: false, source: "test", warnings: [] },
    domainIntelligence: {
      ageDays,
      registrationDate: "2015-01-01T00:00:00.000Z",
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
}

describe("resolveCanonicalFromPersistedColumns", () => {
  it("reconciles drifted trust/risk columns using risk as source of truth", () => {
    const c = resolveCanonicalFromPersistedColumns({
      riskScoreSnapshot: 41,
      normalizedTrustScore: 100,
      normalizedRiskScore: 41
    });
    expect(c.trustScore).toBe(59);
    expect(c.riskScore).toBe(41);
  });

  it("reconciles optimistic trust column against snapshot risk when normalized risk missing", () => {
    const c = resolveCanonicalFromPersistedColumns({
      riskScoreSnapshot: 41,
      normalizedTrustScore: 100
    });
    expect(c.trustScore).toBe(59);
    expect(c.riskScore).toBe(41);
  });
});

describe("display lock alignment", () => {
  it("locks detail normalization to snapshot canonical scores", () => {
    const reviews: ReviewSignals = {
      googleFound: true,
      googleRating: 2.2,
      googleReviewCount: 100,
      trustpilotFound: true,
      trustpilotRating: 2.3,
      trustpilotReviewCount: 400,
      suspiciousReviewSignals: [],
      sources: [],
      warnings: [],
      publicReviewAvailabilityNotes: [],
      reviewFetchDebug: []
    };
    const c = checks(5500);
    const ctx = buildScoringIdentityContext("americatoday.com", c, reviews);
    const score = calculateScamScore({
      domain: "americatoday.com",
      heuristicReasons: [],
      reviewSignals: reviews,
      scoringContext: ctx,
      intelSurface: { confirmedMalicious: false, benignTechnicalBaseline: true }
    });

    const result = {
      score: score.finalScore,
      verdict: score.verdict,
      domain: "americatoday.com",
      reasons: [],
      trustSignals: [],
      providerEvidence: [],
      intelScoreBreakdown: [],
      domainIntelligence: c.domainIntelligence,
      safeBrowsing: c.safeBrowsing,
      openPhish: c.openPhish,
      urlHaus: c.urlHaus,
      ssl: c.ssl,
      police: c.police,
      reviewSignals: reviews,
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
      scoreResult: score,
      domainInfrastructure: {
        dnsResolvable: true,
        rdapIndicatesNotFound: false,
        treatAsNonExistentHost: false
      },
      siteStatus: "caution",
      confidenceLevel: "medium",
      confidenceRationale: "",
      behavioralSignalsPending: {}
    } as import("@/types/scam").ScamCheckResult;

    const canonical = buildCanonicalTrustFieldsFromResult(result);
    const snapshot = {
      id: "scan-1",
      normalizedValue: "americatoday.com",
      checkedValue: "https://americatoday.com",
      lastSeenAt: new Date(),
      display: {
        riskScore: canonical.riskScore,
        trustScore: canonical.trustScore,
        band: "caution",
        label: canonical.consumerVerdictLabel,
        verdict: canonical.consumerVerdict,
        scanId: "scan-1"
      },
      canonical,
      storedResult: null,
      storedNormalized: null,
      statusLabel: "Review snapshot"
    } as LatestPublicCheckSnapshot;

    const locked = normalizeTrustResult(result, {
      displayLock: displayLockFromSnapshot(snapshot)
    });
    expect(locked.trustScore).toBe(canonical.trustScore);
    expect(locked.riskScore).toBe(canonical.riskScore);
  });
});
