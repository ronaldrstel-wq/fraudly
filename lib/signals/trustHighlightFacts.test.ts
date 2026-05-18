import { describe, expect, it } from "vitest";
import {
  domainAgeHighlightBucket,
  extractTrustHighlightFacts,
  formatDomainAgeConsumerLine,
  formatSslConsumerLine,
  sslHighlightBucket
} from "@/lib/signals/trustHighlightFacts";
import { normalizeConsumerSignalsForResult } from "@/lib/signals/normalizeConsumerSignals";
import type { ScamCheckResult } from "@/types/scam";

function minimalResult(overrides: Partial<ScamCheckResult> = {}): ScamCheckResult {
  return {
    score: 50,
    verdict: "suspicious",
    domain: "example.com",
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
    reviewSignals: { trustpilotFound: false, googleFound: false, warnings: [] },
    reviewSummary: "",
    aiUsed: false,
    supplyChainSignals: { warnings: [] },
    scoreResult: { score: 50, signals: [], breakdown: [] },
    domainInfrastructure: { source: "dns", warnings: [] },
    siteStatus: "active",
    confidenceLevel: "medium",
    confidenceRationale: "",
    behavioralSignalsPending: {},
    ...overrides
  } as ScamCheckResult;
}

describe("trustHighlightFacts", () => {
  it("formats young domain as caution", () => {
    expect(formatDomainAgeConsumerLine(12)).toMatch(/relatively new/i);
    expect(domainAgeHighlightBucket(12)).toBe("caution");
  });

  it("formats old domain as positive", () => {
    expect(formatDomainAgeConsumerLine(438)).toMatch(/existed for 1 year, 2 months, 13 days/i);
    expect(domainAgeHighlightBucket(438)).toBe("positive");
  });

  it("formats valid SSL as helpful copy", () => {
    const line = formatSslConsumerLine({
      httpsEnabled: true,
      validCertificate: true,
      source: "tls",
      warnings: []
    });
    expect(line).toMatch(/valid secure connection/i);
    expect(sslHighlightBucket({ httpsEnabled: true, validCertificate: true, source: "tls", warnings: [] })).toBe(
      "positive"
    );
  });

  it("formats invalid SSL as caution", () => {
    const line = formatSslConsumerLine({
      httpsEnabled: true,
      validCertificate: false,
      source: "tls",
      warnings: []
    });
    expect(line).toMatch(/could not be fully verified/i);
  });

  it("places highlights in safety signal buckets without duplicate TLS jargon", () => {
    const result = minimalResult({
      domainIntelligence: { source: "RDAP", warnings: [], ageDays: 438 },
      ssl: { httpsEnabled: true, validCertificate: true, source: "tls", warnings: [] },
      trustSignals: [
        {
          type: "info",
          title: "HTTPS is available",
          description: "TLS valid certificate chain OK."
        }
      ]
    });

    const normalized = normalizeConsumerSignalsForResult(result);
    expect(normalized.helpful.some((l) => /existed for 1 year, 2 months, 13 days/i.test(l))).toBe(true);
    expect(normalized.helpful.some((l) => /valid secure connection/i.test(l))).toBe(true);
    expect(normalized.helpful.filter((l) => /valid secure connection/i.test(l))).toHaveLength(1);
    expect(normalized.helpful.some((l) => /registration details were verified/i.test(l))).toBe(false);
    expect(normalized.helpful.join(" ")).not.toMatch(/\b438\s*days\b/i);
  });

  it("dedupes generic registration copy when age-specific signal exists", () => {
    const result = minimalResult({
      domainIntelligence: { source: "RDAP", warnings: [], ageDays: 438 },
      trustSignals: [
        {
          type: "info",
          title: "Domain registration data",
          description: "RDAP registration data was checked."
        }
      ]
    });
    const normalized = normalizeConsumerSignalsForResult(result);
    expect(normalized.helpful.some((l) => /existed for 1 year, 2 months, 13 days/i.test(l))).toBe(true);
    expect(normalized.helpful.some((l) => /registration details were verified/i.test(l))).toBe(false);
  });

  it("surfaces young domain under Things to watch", () => {
    const result = minimalResult({
      domainIntelligence: { source: "RDAP", warnings: [], ageDays: 12 }
    });
    const normalized = normalizeConsumerSignalsForResult(result);
    expect(normalized.watch.some((l) => /relatively new/i.test(l) && /limited public history/i.test(l))).toBe(
      true
    );
  });

  it("extracts hero highlight rows", () => {
    const facts = extractTrustHighlightFacts(
      minimalResult({
        domainIntelligence: { source: "RDAP", warnings: [], ageDays: 45 },
        ssl: { httpsEnabled: false, validCertificate: false, source: "tls", warnings: [] }
      })
    );
    expect(facts.find((f) => f.id === "domain_age")?.value).toBe("1 month, 15 days");
    expect(facts.find((f) => f.id === "ssl")?.value).toBe("Could not be verified");
  });
});
