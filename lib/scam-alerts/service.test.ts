import { describe, expect, it, vi } from "vitest";

const findMany = vi.fn(async () => [
  {
    slug: "published-alert",
    title: "Published",
    scamType: "phishing",
    affectedBrand: null,
    riskLevel: "high",
    summary: "s",
    safetyTips: ["tip"],
    evidenceCount: 2,
    generatedAt: new Date(),
    updatedAt: new Date(),
    exampleDomainsJson: ["a.com"]
  }
]);

vi.mock("@/lib/db", () => ({
  db: {
    scamAlert: {
      findMany
    }
  }
}));

describe("scam alert service visibility", () => {
  it("queries published-only alerts", async () => {
    const { listPublishedScamAlerts } = await import("@/lib/scam-alerts/service");
    const rows = await listPublishedScamAlerts(10);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "published" }
      })
    );
    expect(rows[0]).toEqual(
      expect.objectContaining({
        slug: "published-alert",
        exampleDomains: ["a.com"]
      })
    );
  });
});
