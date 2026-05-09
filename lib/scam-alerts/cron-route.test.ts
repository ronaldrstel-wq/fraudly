import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const runScamAlertsIngestion = vi.fn(async () => ({
  scanned: 10,
  created: 3,
  updated: 2,
  published: 1,
  statusCounts: { draft: 1, published: 1, archived: 0 },
  failedSources: []
}));

vi.mock("@/lib/scam-alerts/service", () => ({
  runScamAlertsIngestion
}));

describe("cron scam alerts route", () => {
  const oldCronSecret = process.env.CRON_SECRET;
  const oldAdminKey = process.env.ADMIN_RECALC_KEY;
  const oldBypass = process.env.SCAM_ALERTS_DEBUG_BYPASS;

  beforeEach(() => {
    delete process.env.SCAM_ALERTS_DEBUG_BYPASS;
    process.env.CRON_SECRET = "test-cron-secret";
    process.env.ADMIN_RECALC_KEY = "test-admin-key";
    runScamAlertsIngestion.mockClear();
  });

  it("rejects unauthorized requests with safe debug payload", async () => {
    const { POST } = await import("@/app/api/cron/scam-alerts/route");
    const response = await POST(new Request("http://localhost/api/cron/scam-alerts", { method: "POST" }));
    expect(response.status).toBe(401);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.error).toBe("unauthorized");
    const debug = body.debug as Record<string, unknown>;
    expect(debug.hasCronSecret).toBe(true);
    expect(debug.hasAdminRecalcKey).toBe(true);
    expect(debug.providedMethod).toBe("none");
    expect(debug.providedLength).toBe(0);
    expect(debug.expectedCronLength).toBe("test-cron-secret".length);
    expect(debug.expectedAdminLength).toBe("test-admin-key".length);
    expect(debug.matchesCronSecret).toBe(false);
    expect(debug.matchesAdminRecalcKey).toBe(false);
  });

  it("accepts cron secret via header", async () => {
    const { POST } = await import("@/app/api/cron/scam-alerts/route");
    const response = await POST(
      new Request("http://localhost/api/cron/scam-alerts", {
        method: "POST",
        headers: {
          "x-cron-secret": "test-cron-secret"
        }
      })
    );
    expect(response.status).toBe(200);
    expect(runScamAlertsIngestion).toHaveBeenCalledTimes(1);
  });

  it("accepts admin key fallback", async () => {
    const { POST } = await import("@/app/api/cron/scam-alerts/route");
    const response = await POST(
      new Request("http://localhost/api/cron/scam-alerts", {
        method: "POST",
        headers: {
          "x-admin-key": "test-admin-key"
        }
      })
    );
    expect(response.status).toBe(200);
  });

  it("accepts vercel cron GET with bearer secret", async () => {
    const { GET } = await import("@/app/api/cron/scam-alerts/route");
    const response = await GET(
      new Request("http://localhost/api/cron/scam-alerts", {
        method: "GET",
        headers: {
          authorization: "Bearer test-cron-secret",
          "x-vercel-cron": "1"
        }
      })
    );
    expect(response.status).toBe(200);
    expect(runScamAlertsIngestion).toHaveBeenCalledTimes(1);
  });

  it("accepts Authorization Bearer without x-vercel-cron when secrets are set", async () => {
    const { POST } = await import("@/app/api/cron/scam-alerts/route");
    const response = await POST(
      new Request("http://localhost/api/cron/scam-alerts", {
        method: "POST",
        headers: { authorization: "Bearer test-cron-secret" }
      })
    );
    expect(response.status).toBe(200);
  });

  it("accepts x-cron-secret even when Authorization carries a wrong bearer", async () => {
    const { POST } = await import("@/app/api/cron/scam-alerts/route");
    const response = await POST(
      new Request("http://localhost/api/cron/scam-alerts", {
        method: "POST",
        headers: {
          authorization: "Bearer wrong",
          "x-cron-secret": "test-cron-secret"
        }
      })
    );
    expect(response.status).toBe(200);
  });

  it("allows SCAM_ALERTS_DEBUG_BYPASS=true without credentials", async () => {
    process.env.SCAM_ALERTS_DEBUG_BYPASS = "true";
    const { POST } = await import("@/app/api/cron/scam-alerts/route");
    const response = await POST(new Request("http://localhost/api/cron/scam-alerts", { method: "POST" }));
    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.authDebugBypass).toBe(true);
  });

  afterAll(() => {
    process.env.CRON_SECRET = oldCronSecret;
    process.env.ADMIN_RECALC_KEY = oldAdminKey;
    if (oldBypass === undefined) delete process.env.SCAM_ALERTS_DEBUG_BYPASS;
    else process.env.SCAM_ALERTS_DEBUG_BYPASS = oldBypass;
  });
});
