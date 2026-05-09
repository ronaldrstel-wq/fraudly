import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const runScamAlertsIngestion = vi.fn(async () => ({
  scanned: 10,
  created: 3,
  updated: 2,
  published: 1,
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

  afterAll(() => {
    process.env.CRON_SECRET = oldCronSecret;
    process.env.ADMIN_RECALC_KEY = oldAdminKey;
  });
});
