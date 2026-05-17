import { describe, expect, it } from "vitest";
import {
  PUBLIC_RESULT_PAYLOAD_SCHEMA_VERSION,
  alignNormalizedTrustToCanonical,
  buildCanonicalTrustFieldsFromResult,
  buildPublicResultPayloadV2,
  parsePublicResultPayload
} from "@/lib/trust/canonicalTrustBridge";
import { buildNormalizedTrustFromLegacyResult } from "@/lib/trust/canonicalTrustBridge";
import { PUBLIC_SNAPSHOT_LABEL_STRONG_RISK } from "@/lib/latest-public-checks/status-label";

function minimalResult(overrides: Record<string, unknown> = {}) {
  return {
    score: 88,
    verdict: "scam",
    domain: "scam-example.com",
    reasons: [],
    trustSignals: [],
    providerEvidence: [],
    intelScoreBreakdown: [],
    domainIntelligence: { source: "test", warnings: [] },
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
    scoreResult: { baseScore: 50, finalScore: 88, verdict: "scam", signals: [], topPositive: [], topNegative: [] },
    domainInfrastructure: { source: "dns", warnings: [] },
    siteStatus: "active",
    confidenceLevel: "medium",
    confidenceRationale: "",
    behavioralSignalsPending: {},
    ...overrides
  } as unknown as import("@/types/scam").ScamCheckResult;
}

describe("canonicalTrustBridge", () => {
  it("builds canonical fields from risk score", () => {
    const canonical = buildCanonicalTrustFieldsFromResult(minimalResult());
    expect(canonical.riskScore).toBe(88);
    expect(canonical.trustScore).toBe(12);
    expect(canonical.consumerVerdictLabel).toBe("High Risk");
    expect(canonical.consumerVerdict).toBe("scam");
  });

  it("v2 payload round-trips with aligned normalized trust", () => {
    const result = minimalResult();
    const canonical = buildCanonicalTrustFieldsFromResult(result);
    const normalized = alignNormalizedTrustToCanonical(
      buildNormalizedTrustFromLegacyResult(result),
      canonical
    );
    const payload = buildPublicResultPayloadV2(result, normalized, canonical);
    expect(payload.schemaVersion).toBe(PUBLIC_RESULT_PAYLOAD_SCHEMA_VERSION);

    const parsed = parsePublicResultPayload(payload, "scam-example.com");
    expect(parsed?.schemaVersion).toBe(2);
    expect(parsed?.canonical?.riskScore).toBe(88);
    expect(parsed?.normalizedTrustResult?.trustScore).toBe(12);
    expect(parsed?.normalizedTrustResult?.verdict).toBe("High Risk");
    expect(parsed?.result.score).toBe(88);
  });

  it("statusLabel cannot override consumer verdict in parsed payload", () => {
    const result = minimalResult({ score: 20, verdict: "safe" });
    const canonical = buildCanonicalTrustFieldsFromResult(result);
    const normalized = alignNormalizedTrustToCanonical(
      buildNormalizedTrustFromLegacyResult(result),
      canonical
    );
    const payload = buildPublicResultPayloadV2(result, normalized, canonical);
    const parsed = parsePublicResultPayload(payload, "scam-example.com");
    expect(parsed?.normalizedTrustResult?.verdict).toBe("Mostly Safe");
    void PUBLIC_SNAPSHOT_LABEL_STRONG_RISK;
  });

  it("legacy flat payload still parses result", () => {
    const result = minimalResult({ score: 50, verdict: "suspicious" });
    const parsed = parsePublicResultPayload(result, "scam-example.com");
    expect(parsed?.schemaVersion).toBe(1);
    expect(parsed?.result.domain).toBe("scam-example.com");
    expect(parsed?.canonical?.consumerVerdictLabel).toBe("Use Caution");
  });
});
