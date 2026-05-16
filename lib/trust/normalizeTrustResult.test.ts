import { describe, expect, it } from "vitest";
import { DOMAIN_AGE_NOT_VERIFIED_LABEL } from "@/lib/format/domainAge";
import { PUBLIC_REVIEW_NOT_MATCHED_COPY } from "@/lib/reputation/reviewMatchConfidence";
import { FEED_CLEAN_SUMMARY, FEED_HIT_SUMMARY } from "@/lib/signals/feedConsumerSignals";
import { buildOverviewFromNormalized } from "@/lib/overviewCardPresentation";
import { displayTrustScoreForResult } from "@/lib/scanPresentation";
import { normalizeTrustResult } from "@/lib/trust/normalizeTrustResult";
import type { ScamCheckResult } from "@/types/scam";

function establishedFixture(overrides: Partial<ScamCheckResult> = {}): ScamCheckResult {
  return {
    score: 12,
    verdict: "safe",
    domain: "example-retailer.nl",
    reasons: [],
    trustSignals: [
      { type: "info", title: "No OpenPhish match found in this snapshot", description: "", source: "OpenPhish" },
      { type: "info", title: "No URLhaus match found in this snapshot", description: "", source: "URLhaus" }
    ],
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
    ],
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
    scoreResult: { baseScore: 50, finalScore: 12, verdict: "safe", signals: [], topPositive: [], topNegative: [] },
    domainInfrastructure: { source: "dns", warnings: [] },
    siteStatus: "active",
    confidenceLevel: "low",
    confidenceRationale: "",
    behavioralSignalsPending: {},
    ...overrides
  } as ScamCheckResult;
}

describe("normalizeTrustResult", () => {
  it("established retailer: likely safe, age from nested evidence, no limited strip", () => {
    const normalized = normalizeTrustResult(establishedFixture());
    expect(normalized.verdict).toBe("Likely Safe");
    expect(normalized.domainAge.verified).toBe(true);
    expect(normalized.domainAge.display).toMatch(/10 years/);
    expect(normalized.ssl.valid).toBe(true);
    expect(normalized.feeds.status).toBe("clean");
    expect(normalized.showLimitedPublicStrip).toBe(false);
    expect(normalized.helpfulSignals.some((l: string) => l.includes(FEED_CLEAN_SUMMARY))).toBe(true);
    expect(normalized.cautionSignals.some((l) => l.includes(FEED_HIT_SUMMARY))).toBe(false);
  });

  it("same score when display lock from public snapshot", () => {
    const raw = establishedFixture();
    const locked = normalizeTrustResult(raw, {
      displayLock: {
        riskScore: 14,
        trustScore: 86,
        verdict: "Likely Safe",
        scanId: "scan_1",
        source: "public_snapshot"
      }
    });
    const live = normalizeTrustResult(raw);
    expect(locked.trustScore).toBe(86);
    expect(locked.verdict).toBe("Likely Safe");
    expect(live.trustScore).toBe(displayTrustScoreForResult(raw));
    expect(locked.domainAge.display).toBe(live.domainAge.display);
    const overview = buildOverviewFromNormalized(locked);
    expect(overview.trustScore).toBe(86);
    expect(overview.verdictLabel).toBe("Likely Safe");
  });

  it("extracts age from provider evidence when domainIntelligence.ageDays missing", () => {
    const normalized = normalizeTrustResult(
      establishedFixture({
        domainIntelligence: { source: "RDAP", warnings: [] }
      })
    );
    expect(normalized.domainAge.ageDays).toBe(3650);
    expect(normalized.domainAge.display).not.toBe(DOMAIN_AGE_NOT_VERIFIED_LABEL);
  });

  it("hides low-confidence Google rating without review count", () => {
    const normalized = normalizeTrustResult(
      establishedFixture({
        reviewSignals: {
          googleFound: true,
          googleRating: 2,
          googleReviewCount: undefined,
          trustpilotFound: false,
          suspiciousReviewSignals: [],
          sources: [],
          warnings: [],
          publicReviewAvailabilityNotes: [],
          reviewFetchDebug: []
        }
      })
    );
    expect(normalized.reputation.google.display).toBeNull();
    expect(normalized.reputation.google.confidence).toBe("low");
  });

  it("feed clean without hit does not show scam warning", () => {
    const normalized = normalizeTrustResult(establishedFixture());
    expect(normalized.cautionSignals.some((l) => l.includes("appears in known scam"))).toBe(false);
  });

  it("confirmed feed hit shows warning only", () => {
    const normalized = normalizeTrustResult(
      establishedFixture({
        openPhish: { listed: true, matches: ["https://evil.example"], source: "OpenPhish", warnings: [] },
        trustSignals: [
          { type: "danger", title: "Listed in OpenPhish public feed", description: "", source: "OpenPhish" },
          { type: "info", title: "No URLhaus match found in this snapshot", description: "", source: "URLhaus" }
        ]
      })
    );
    expect(normalized.feeds.status).toBe("hit");
    expect(normalized.cautionSignals.some((l) => l.includes(FEED_HIT_SUMMARY))).toBe(true);
    expect(normalized.helpfulSignals.some((l: string) => l.includes(FEED_CLEAN_SUMMARY))).toBe(false);
  });

  it("surfaces neutral reputation fallback when reviews not matched", () => {
    const normalized = normalizeTrustResult(establishedFixture());
    expect(normalized.reputation.trustpilot.display).toBeNull();
    expect(normalized.reputation.neutralFallback).toBe(PUBLIC_REVIEW_NOT_MATCHED_COPY);
  });
});
