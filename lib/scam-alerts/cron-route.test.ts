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

  beforeEach(() => {
    process.env.CRON_SECRET = "test-cron-secret";
    process.env.ADMIN_RECALC_KEY = "test-admin-key";
    runScamAlertsIngestion.mockClear();
  });

  it("rejects unauthorized requests", async () => {
    const { POST } = await import("@/app/api/cron/scam-alerts/route");
    const response = await POST(new Request("http://localhost/api/cron/scam-alerts", { method: "POST" }));
    expect(response.status).toBe(401);
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

  afterAll(() => {
    process.env.CRON_SECRET = oldCronSecret;
    process.env.ADMIN_RECALC_KEY = oldAdminKey;
  });
});
