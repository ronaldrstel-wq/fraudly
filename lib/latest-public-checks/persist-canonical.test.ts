import { describe, expect, it } from "vitest";
import {
  buildCanonicalTrustFieldsFromResult,
  buildPublicResultPayloadV2
} from "@/lib/trust/canonicalTrustBridge";
import { buildNormalizedTrustFromLegacyResult, alignNormalizedTrustToCanonical } from "@/lib/trust/canonicalTrustBridge";
import { parsePublicResultPayload } from "@/lib/trust/canonicalTrustBridge";

describe("persist canonical snapshot fields", () => {
  it("produces aligned payload matching risk/trust columns", () => {
    const result = {
      score: 45,
      verdict: "suspicious",
      domain: "shop.example",
      reasons: [],
      trustSignals: [{ type: "info", title: "t", description: "d" }],
      providerEvidence: [],
      intelScoreBreakdown: [],
      domainIntelligence: { source: "x", warnings: [] },
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
      scoreResult: { baseScore: 50, finalScore: 45, verdict: "suspicious", signals: [], topPositive: [], topNegative: [] },
      domainInfrastructure: { source: "dns", warnings: [] },
      siteStatus: "active",
      confidenceLevel: "medium",
      confidenceRationale: "",
      behavioralSignalsPending: {}
    } as unknown as import("@/types/scam").ScamCheckResult;

    const canonical = buildCanonicalTrustFieldsFromResult(result);
    const normalized = alignNormalizedTrustToCanonical(
      buildNormalizedTrustFromLegacyResult(result),
      canonical
    );
    const payload = buildPublicResultPayloadV2(result, normalized, canonical);

    const row = {
      riskScoreSnapshot: canonical.riskScore,
      normalizedTrustScore: canonical.trustScore,
      normalizedRiskScore: canonical.riskScore,
      consumerVerdictLabel: canonical.consumerVerdictLabel,
      consumerVerdict: canonical.consumerVerdict,
      consumerVerdictBand: canonical.consumerVerdictBand,
      statusLabel: "Strong risk context snapshot"
    };

    expect(row.normalizedTrustScore).toBe(55);
    expect(row.riskScoreSnapshot).toBe(45);

    const parsed = parsePublicResultPayload(payload, "shop.example");
    expect(parsed?.normalizedTrustResult?.trustScore).toBe(row.normalizedTrustScore);
    expect(parsed?.normalizedTrustResult?.riskScore).toBe(row.normalizedRiskScore);
  });
});
