import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@prisma/client";
import { POST } from "@/app/api/check/route";
import { reserveScanQuotaOrReject } from "@/lib/checkRateLimits";
import { runWebsiteAnalysis } from "@/lib/analysis/runWebsiteAnalysis";
import { getBillingUserOrNull } from "@/lib/user-store";

const scanResultFixture = {
  score: 42,
  verdict: "safe" as const,
  domain: "example.com",
  reasons: [],
  trustSignals: [],
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
    finalScore: 42,
    verdict: "safe" as const,
    signals: [],
    topPositive: [],
    topNegative: [],
    topPositiveSignals: [],
    topNegativeSignals: []
  },
  domainInfrastructure: {
    source: "dns",
    warnings: [],
    dnsResolvable: true,
    rdapIndicatesNotFound: false,
    treatAsNonExistentHost: false
  },
  siteStatus: "active" as const,
  confidenceLevel: "medium" as const,
  confidenceRationale: "",
  behavioralSignalsPending: {}
};

vi.mock("@/lib/analysis/runWebsiteAnalysis", () => ({
  runWebsiteAnalysis: vi.fn(async (_url: string) => ({
    ...scanResultFixture,
    domain: new URL(_url).hostname
  }))
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
    checkDailyLimiter: {
      consume: vi.fn(() => ({ allowed: true, count: 1, limit: 5 }))
    },
    getClientIp: vi.fn(() => "192.168.50.90")
  };
});

process.env.RATE_LIMIT_HASH_SECRET = "________test-hash-secret________";

const anonCookieName = "fraudly_free_check_used";

function mockUser(partial: Partial<User> & Pick<User, "id">): User {
  return {
    authProvider: "clerk",
    authProviderId: "clerk_test",
    email: null,
    plan: "free",
    credits: 0,
    freeChecksUsed: 0,
    monthlyChecksUsed: 0,
    paidChecksCount: 0,
    subscriptionStatus: "inactive",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial
  };
}

function makeRequest(body: Record<string, unknown>, cookieHeader?: string) {
  return new Request("https://fraudly.app/api/check", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "vitest-route",
      "accept-language": "en-US",
      ...(cookieHeader ? { cookie: cookieHeader } : {})
    },
    body: JSON.stringify(body)
  });
}

describe("/api/check rate guard wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(reserveScanQuotaOrReject).mockResolvedValue({ ok: true });
  });

  it("does not invoke expensive analysis when DB quota rejects the request", async () => {
    vi.mocked(getBillingUserOrNull).mockResolvedValue(mockUser({ id: "user_limits" }));

    vi.mocked(reserveScanQuotaOrReject).mockResolvedValue({
      ok: false,
      reason: "ip_burst",
      message: "slow down"
    });

    const res = await POST(makeRequest({ url: "example.com" }));
    expect(res.status).toBe(429);
    expect(runWebsiteAnalysis).not.toHaveBeenCalled();
  });

  it("runs analysis when quotas pass for an authenticated visitor", async () => {
    vi.mocked(getBillingUserOrNull).mockResolvedValue(mockUser({ id: "user_ok" }));

    const res = await POST(makeRequest({ url: "example.org" }));

    expect(res.status).toBe(200);
    expect(reserveScanQuotaOrReject).toHaveBeenCalled();
    expect(runWebsiteAnalysis).toHaveBeenCalledTimes(1);
    expect(runWebsiteAnalysis).toHaveBeenCalledWith("https://example.org/", "en", { scanKind: "full" });
  });

  it("still allows the first anonymous check before signup gating engages", async () => {
    vi.mocked(getBillingUserOrNull).mockResolvedValue(null);

    const res = await POST(makeRequest({ url: "shop.example.net" }));

    expect(res.status).toBe(200);
    expect(reserveScanQuotaOrReject).toHaveBeenCalledWith(
      expect.objectContaining({
        authenticated: false,
        userId: null,
        paid: false,
        scanType: "deep"
      })
    );
    expect(runWebsiteAnalysis).toHaveBeenCalledWith("https://shop.example.net/", "en", { scanKind: "full" });
  });

  it("stops quota enforcement before signup errors for anonymous repeats", async () => {
    vi.mocked(getBillingUserOrNull).mockResolvedValue(null);

    const res = await POST(
      makeRequest({ url: "repeat.example.invalid" }, `${anonCookieName}=true`)
    );

    expect(res.status).toBe(401);
    expect(reserveScanQuotaOrReject).not.toHaveBeenCalled();
    expect(runWebsiteAnalysis).not.toHaveBeenCalled();
  });

  it("passes shallow scan classification to quota guard", async () => {
    vi.mocked(getBillingUserOrNull).mockResolvedValue(mockUser({ id: "user_basic" }));

    await POST(makeRequest({ url: "news.example.gov", detailLevel: "basic" }));

    expect(reserveScanQuotaOrReject).toHaveBeenCalledWith(
      expect.objectContaining({
        scanType: "basic"
      })
    );
    expect(runWebsiteAnalysis).toHaveBeenCalledWith("https://news.example.gov/", "en", { scanKind: "basic" });
  });
});
