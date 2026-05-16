import { describe, expect, it } from "vitest";
import { DOMAIN_AGE_NOT_VERIFIED_LABEL } from "@/lib/format/domainAge";
import {
  displayAgeFromNormalized,
  enrichScamCheckResultDomainAge,
  normalizeDomainAge
} from "@/lib/domain/normalizeDomainAge";
import type { ScamCheckResult } from "@/types/scam";

function minimalResult(
  overrides: Partial<ScamCheckResult> & {
    domainIntelligence?: ScamCheckResult["domainIntelligence"];
  } = {}
): ScamCheckResult {
  return {
    score: 20,
    verdict: "safe",
    domain: "example-retailer.nl",
    reasons: [],
    trustSignals: [],
    providerEvidence: [],
    intelScoreBreakdown: [],
    domainIntelligence: { source: "RDAP", warnings: [] },
    safeBrowsing: { safeBrowsingStatus: "safe", safeBrowsingThreats: [], source: "GSB", warnings: [] },
    openPhish: { listed: false, matches: [], source: "OpenPhish", warnings: [] },
    urlHaus: { listed: false, matches: [], source: "URLhaus", warnings: [] },
    ssl: { httpsEnabled: true, validCertificate: true, source: "tls", warnings: [] },
    police: { listedInPoliceScamDatabase: false, source: "police", warnings: [] },
    reviewSignals: {
      googleFound: false,
      trustpilotFound: false,
      suspiciousReviewSignals: [],
      sources: [],
      warnings: [],
      publicReviewAvailabilityNotes: [],
      reviewFetchDebug: []
    },
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
    scoreResult: { baseScore: 50, finalScore: 20, verdict: "safe", signals: [], topPositive: [], topNegative: [] },
    domainInfrastructure: { source: "dns", warnings: [] },
    siteStatus: "active",
    confidenceLevel: "medium",
    confidenceRationale: "",
    behavioralSignalsPending: {},
    ...overrides
  } as ScamCheckResult;
}

describe("normalizeDomainAge", () => {
  it("uses domainIntelligence.ageDays when present", () => {
    const normalized = normalizeDomainAge(
      minimalResult({
        domainIntelligence: { source: "RDAP", warnings: [], ageDays: 3650 }
      })
    );
    expect(normalized.ageDays).toBe(3650);
    expect(normalized.displayAge).toMatch(/10 years/);
    expect(normalized.source).toBe("domainIntelligence.ageDays");
  });

  it("finds age from provider evidence when top-level ageDays missing", () => {
    const normalized = normalizeDomainAge(
      minimalResult({
        domainIntelligence: { source: "RDAP (SIDN)", warnings: [] },
        providerEvidence: [
          {
            source: "RDAP (SIDN)",
            category: "domain",
            severity: "info",
            matched: false,
            title: "Registration data (RDAP)",
            description: "Approximate domain age: 3650 days.",
            confidence: "high",
            raw: { ageDays: 3650 }
          }
        ]
      })
    );
    expect(normalized.ageDays).toBe(3650);
    expect(displayAgeFromNormalized(normalized)).toMatch(/10 years/);
    expect(displayAgeFromNormalized(normalized)).not.toBe(DOMAIN_AGE_NOT_VERIFIED_LABEL);
  });

  it("derives age from registrationDate when days missing", () => {
    const registered = new Date();
    registered.setUTCFullYear(registered.getUTCFullYear() - 3);
    const normalized = normalizeDomainAge(
      minimalResult({
        domainIntelligence: {
          source: "RDAP",
          warnings: [],
          registrationDate: registered.toISOString()
        }
      })
    );
    expect(normalized.ageDays).not.toBeNull();
    expect(normalized.displayAge).toMatch(/year/i);
  });

  it("returns Not verified only when no source has age", () => {
    const normalized = normalizeDomainAge(minimalResult());
    expect(displayAgeFromNormalized(normalized)).toBe(DOMAIN_AGE_NOT_VERIFIED_LABEL);
    expect(normalized.ageDays).toBeNull();
  });

  it("enrichScamCheckResultDomainAge backfills domainIntelligence.ageDays", () => {
    const base = minimalResult({
      domainIntelligence: { source: "RDAP", warnings: [] },
      providerEvidence: [
        {
          source: "RDAP",
          category: "domain",
          severity: "info",
          matched: false,
          title: "Registration data (RDAP)",
          description: "Approximate domain age: 3650 days.",
          confidence: "high",
          raw: { ageDays: 3650 }
        }
      ]
    });
    const enriched = enrichScamCheckResultDomainAge(base);
    expect(enriched.domainIntelligence.ageDays).toBe(3650);
    expect(
      displayAgeFromNormalized(normalizeDomainAge({ domainIntelligence: enriched.domainIntelligence }))
    ).toMatch(/10 years/);
  });
});
