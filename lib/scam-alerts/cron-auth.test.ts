import { beforeEach, describe, expect, it, vi } from "vitest";

const runScamAlertsJob = vi.fn(async () => ({
  sourcesFetched: [],
  signalsStored: 0,
  alertsGenerated: 0,
  alertsPublished: 0,
  errors: []
}));

vi.mock("@/lib/scam-alerts/run", () => ({
  runScamAlertsJob
}));

describe("cron scam alerts auth", () => {
  beforeEach(() => {
    runScamAlertsJob.mockClear();
    process.env.CRON_SECRET = "secret-token";
  });

  it("rejects unauthorized requests", async () => {
    const { GET } = await import("@/app/api/cron/scam-alerts/route");
    const response = await GET(new Request("http://localhost/api/cron/scam-alerts"));
    expect(response.status).toBe(401);
    expect(runScamAlertsJob).not.toHaveBeenCalled();
  });

  it("accepts bearer authorization", async () => {
    const { GET } = await import("@/app/api/cron/scam-alerts/route");
    const response = await GET(
      new Request("http://localhost/api/cron/scam-alerts", {
        headers: { authorization: "Bearer secret-token" }
      })
    );
    expect(response.status).toBe(200);
    expect(runScamAlertsJob).toHaveBeenCalledTimes(1);
  });
});
