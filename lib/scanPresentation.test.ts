import { describe, expect, it } from "vitest";
import type { ScamCheckResult } from "@/types/scam";
import {
  CRITICAL_THREAT_MAX_TRUST,
  assessCriticalThreat,
  displayTrustScoreForResult,
  primaryCriticalThreatReason,
  requiresCriticalTrustClamp
} from "@/lib/scanPresentation";
import type { ExternalChecksResult } from "@/lib/checks/types";

function baseResult(over: Partial<ScamCheckResult> = {}): ScamCheckResult {
  const checks: ExternalChecksResult = {
    police: { listedInPoliceScamDatabase: false, source: "p", warnings: [] },
    domainIntelligence: { source: "d", warnings: [] },
    safeBrowsing: { safeBrowsingStatus: "safe", safeBrowsingThreats: [], source: "sb", warnings: [] },
    openPhish: { listed: false, matches: [], source: "op", warnings: [] },
    urlHaus: { listed: false, matches: [], source: "uh", warnings: [] },
    ssl: { httpsEnabled: true, validCertificate: true, source: "tls", warnings: [] },
    providerEvidence: [],
    warnings: []
  };
  return {
    score: 35,
    verdict: "safe",
    domain: "example.com",
    reasons: [],
    trustSignals: [],
    providerEvidence: [],
    intelScoreBreakdown: [],
    domainIntelligence: checks.domainIntelligence,
    safeBrowsing: checks.safeBrowsing,
    openPhish: checks.openPhish,
    urlHaus: checks.urlHaus,
    ssl: checks.ssl,
    police: checks.police,
    reviewSignals: {} as ScamCheckResult["reviewSignals"],
    reviewSummary: "",
    aiUsed: false,
    supplyChainSignals: {} as ScamCheckResult["supplyChainSignals"],
    scoreResult: {} as ScamCheckResult["scoreResult"],
    domainInfrastructure: {} as ScamCheckResult["domainInfrastructure"],
    siteStatus: "caution",
    confidenceLevel: "low",
    confidenceRationale: "",
    behavioralSignalsPending: {},
    ...over
  };
}

describe("assessCriticalThreat + display trust", () => {
  it("A) OpenPhish match activates override and clamps displayed trust", () => {
    const result = baseResult({
      score: 55,
      openPhish: { listed: true, matches: ["https://x"], source: "OpenPhish", warnings: [] }
    });
    const a = assessCriticalThreat(result);
    expect(a.active).toBe(true);
    expect(a.kind).toBe("phishing_feed");
    expect(displayTrustScoreForResult(result)).toBeLessThanOrEqual(CRITICAL_THREAT_MAX_TRUST);
    expect(primaryCriticalThreatReason(result)).toMatch(/OpenPhish/i);
  });

  it("B) Legit-style snapshot (no feeds, healthy score) is not an override", () => {
    const result = baseResult({ score: 28 });
    expect(assessCriticalThreat(result).active).toBe(false);
    expect(displayTrustScoreForResult(result)).toBe(72);
  });

  it("C) Police match is confirmed malicious kind", () => {
    const result = baseResult({
      score: 40,
      police: {
        listedInPoliceScamDatabase: true,
        source: "Police",
        warnings: [],
        policeWarningReason: "Listed on guidance page"
      }
    });
    expect(assessCriticalThreat(result).kind).toBe("government_warning");
    expect(primaryCriticalThreatReason(result)).toContain("Listed on guidance");
  });

  it("D) No evidence danger row alone triggers clamp helper", () => {
    const checks: ExternalChecksResult = {
      police: { listedInPoliceScamDatabase: false, source: "p", warnings: [] },
      domainIntelligence: { source: "d", warnings: [] },
      safeBrowsing: { safeBrowsingStatus: "safe", safeBrowsingThreats: [], source: "sb", warnings: [] },
      openPhish: { listed: false, matches: [], source: "op", warnings: [] },
      urlHaus: { listed: false, matches: [], source: "uh", warnings: [] },
      ssl: { httpsEnabled: true, validCertificate: true, source: "tls", warnings: [] },
      providerEvidence: [
        {
          source: "X",
          category: "phishing",
          severity: "danger",
          matched: true,
          title: "Hit",
          description: "bad",
          confidence: "high"
        }
      ],
      warnings: []
    };
    expect(requiresCriticalTrustClamp(checks)).toBe(true);
  });
});
