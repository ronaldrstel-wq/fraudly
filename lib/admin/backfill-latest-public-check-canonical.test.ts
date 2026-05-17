import { describe, expect, it } from "vitest";
import { planBackfillRow } from "@/lib/admin/backfill-latest-public-check-canonical";
import {
  buildPublicResultPayloadV2,
  buildCanonicalTrustFieldsFromResult,
  buildNormalizedTrustFromLegacyResult,
  alignNormalizedTrustToCanonical
} from "@/lib/trust/canonicalTrustBridge";

function fixtureResult() {
  return {
    score: 22,
    verdict: "safe" as const,
    domain: "example.com",
    reasons: [],
    trustSignals: [{ type: "info" as const, title: "t", description: "d" }],
    providerEvidence: [],
    intelScoreBreakdown: [],
    domainIntelligence: { source: "test", warnings: [] },
    safeBrowsing: { safeBrowsingStatus: "safe" as const, safeBrowsingThreats: [], source: "GSB", warnings: [] },
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
      confidence: "low" as const,
      dropshipConfidence: "low" as const,
      chinaConfidence: "low" as const,
      localConfidence: "low" as const,
      reasons: [],
      scoreAdjustment: 0
    },
    scoreResult: {
      baseScore: 50,
      finalScore: 22,
      verdict: "safe" as const,
      signals: [],
      topPositive: [],
      topNegative: [],
      topPositiveSignals: [],
      topNegativeSignals: []
    },
    domainInfrastructure: { source: "dns", warnings: [] },
    siteStatus: "active" as const,
    confidenceLevel: "medium" as const,
    confidenceRationale: "",
    behavioralSignalsPending: {}
  } as unknown as import("@/types/scam").ScamCheckResult;
}

describe("backfill latest public check canonical", () => {
  it("dry-run plan updates canonical fields from v2 payload", () => {
    const result = fixtureResult();
    const canonical = buildCanonicalTrustFieldsFromResult(result);
    const normalized = alignNormalizedTrustToCanonical(
      buildNormalizedTrustFromLegacyResult(result),
      canonical
    );
    const payload = buildPublicResultPayloadV2(result, normalized, canonical);

    const plan = planBackfillRow({
      id: "row1",
      normalizedValue: "example.com",
      riskScoreSnapshot: 22,
      statusLabel: "Lower risk context snapshot",
      publicResultPayload: payload
    });

    expect(plan.update).not.toBeNull();
    expect(plan.update?.normalizedTrustScore).toBe(78);
    expect(plan.update?.consumerVerdictLabel).toBe("Mostly Safe");
    expect(plan.update?.consumerVerdictBand).toBe("mostly-safe");
  });

  it("skips rows without parseable payload", () => {
    const plan = planBackfillRow({
      id: "row2",
      normalizedValue: "orphan.com",
      riskScoreSnapshot: 50,
      statusLabel: "Mixed signals snapshot",
      publicResultPayload: null
    });
    expect(plan.update).toBeNull();
    expect(plan.skipReason).toBe("no_parseable_payload");
  });

  it("statusLabel does not change consumer verdict in plan", () => {
    const result = fixtureResult();
    const canonical = buildCanonicalTrustFieldsFromResult(result);
    const normalized = alignNormalizedTrustToCanonical(
      buildNormalizedTrustFromLegacyResult(result),
      canonical
    );
    const payload = buildPublicResultPayloadV2(result, normalized, canonical);

    const plan = planBackfillRow({
      id: "row3",
      normalizedValue: "example.com",
      riskScoreSnapshot: 22,
      statusLabel: "Strong risk context snapshot",
      publicResultPayload: payload
    });

    expect(plan.update?.consumerVerdictLabel).toBe("Mostly Safe");
  });
});
