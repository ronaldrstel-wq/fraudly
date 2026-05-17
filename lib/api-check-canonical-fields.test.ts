import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/check/route";
import { runWebsiteAnalysis } from "@/lib/analysis/runWebsiteAnalysis";
import { reserveScanQuotaOrReject } from "@/lib/checkRateLimits";
import { getBillingUserOrNull } from "@/lib/user-store";

const scanResult = {
  score: 22,
  verdict: "safe",
  domain: "example.com",
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
  scoreResult: { baseScore: 50, finalScore: 22, verdict: "safe", signals: [], topPositive: [], topNegative: [] },
  domainInfrastructure: { source: "dns", warnings: [] },
  siteStatus: "active",
  confidenceLevel: "medium",
  confidenceRationale: "",
  behavioralSignalsPending: {}
} as const;

vi.mock("@/lib/analysis/runWebsiteAnalysis", () => ({
  runWebsiteAnalysis: vi.fn(async () => scanResult)
}));

vi.mock("@/lib/latest-public-checks/persist", () => ({
  upsertLatestPublicCheckFromCompletedScan: vi.fn(async () => undefined)
}));

vi.mock("@/lib/recent-search/service", () => ({
  tryRecordRecentSearch: vi.fn(async () => undefined)
}));

vi.mock("@/lib/checkRateLimits", () => ({
  reserveScanQuotaOrReject: vi.fn()
}));

vi.mock("@/lib/user-store", () => ({
  getBillingUserOrNull: vi.fn()
}));

vi.mock("@/lib/rateLimiter", async () => {
  const actual = await vi.importActual<typeof import("@/lib/rateLimiter")>("@/lib/rateLimiter");
  return {
    ...actual,
    checkDailyLimiter: { consume: vi.fn(() => ({ allowed: true, count: 1, limit: 5 })) },
    getClientIp: vi.fn(() => "127.0.0.1")
  };
});

vi.mock("@/lib/db", () => ({
  db: { domainAdminOverride: { findUnique: vi.fn(async () => null) } }
}));

process.env.RATE_LIMIT_HASH_SECRET = "________test-hash-secret________";

describe("POST /api/check canonical fields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(reserveScanQuotaOrReject).mockResolvedValue({ ok: true });
    vi.mocked(getBillingUserOrNull).mockResolvedValue(null);
  });

  it("returns canonical trust fields and legacy result", async () => {
    const res = await POST(
      new Request("https://fraudly.app/api/check", {
        method: "POST",
        headers: { "content-type": "application/json", "user-agent": "vitest" },
        body: JSON.stringify({ url: "https://example.com" })
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.result).toBeDefined();
    expect(body.result.score).toBe(22);
    expect(body.result.verdict).toBe("safe");

    expect(body.trustScore).toBe(78);
    expect(body.riskScore).toBe(22);
    expect(body.consumerVerdictLabel).toBe("Mostly Safe");
    expect(body.consumerVerdict).toBe("safe");
    expect(body.scoreConfidence).toBe("medium");
    expect(body.normalizedTrustResult).toBeDefined();
    expect(body.normalizedTrustResult.trustScore).toBe(78);
    expect(body.normalizedTrustResult.verdict).toBe("Mostly Safe");
    expect(runWebsiteAnalysis).toHaveBeenCalled();
  });
});
