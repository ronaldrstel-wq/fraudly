import { describe, expect, it } from "vitest";
import { normalizeTrustResult } from "@/lib/trust/normalizeTrustResult";
import {
  collectNormalizedDataConfidenceBadges,
  reviewChannelConfidenceIndicator
} from "@/lib/trust/dataConfidence";
import type { NormalizedReviewChannel } from "@/lib/trust/types";

describe("dataConfidence", () => {
  it("maps review channel states to indicators", () => {
    const strong: NormalizedReviewChannel = {
      rating: 4.5,
      reviewCount: 100,
      confidence: "high",
      display: "4.5 (100)",
      found: true,
      usedInTrustScore: true,
      displayState: "strong",
      reputationLabel: "Positive",
      scoreImpactLabel: "Used",
      showMetrics: true,
      confidenceScore: 0.9,
      bodyMessage: ""
    };
    expect(reviewChannelConfidenceIndicator(strong)).toBe("verified");
  });

  it("collects scan coverage badge for low confidence", () => {
    const normalized = normalizeTrustResult({
      score: 40,
      verdict: "suspicious",
      domain: "x.com",
      reasons: [],
      trustSignals: [],
      providerEvidence: [],
      intelScoreBreakdown: [],
      domainIntelligence: { source: "t", warnings: [] },
      safeBrowsing: { safeBrowsingStatus: "unknown", safeBrowsingThreats: [], source: "GSB", warnings: [] },
      openPhish: { listed: false, matches: [], source: "OpenPhish", warnings: [] },
      urlHaus: { listed: false, matches: [], source: "URLhaus", warnings: [] },
      ssl: { httpsEnabled: false, validCertificate: false, source: "tls", warnings: [] },
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
      scoreResult: { baseScore: 50, finalScore: 40, verdict: "suspicious", signals: [], topPositive: [], topNegative: [] },
      domainInfrastructure: { source: "dns", warnings: [] },
      siteStatus: "active",
      confidenceLevel: "low",
      confidenceRationale: "",
      behavioralSignalsPending: {}
    } as unknown as import("@/types/scam").ScamCheckResult);
    const badges = collectNormalizedDataConfidenceBadges(normalized);
    expect(badges.some((b) => b.indicator === "limited")).toBe(true);
  });
});
