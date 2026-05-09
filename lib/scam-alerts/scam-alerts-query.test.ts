import type { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { buildPublishedActiveScamAlertWhere, buildPublishedScamAlertsWhere } from "@/lib/scam-alerts/service";

function expectAndChain(w: Prisma.ScamAlertWhereInput): Prisma.ScamAlertWhereInput[] {
  if (typeof w === "object" && w !== null && "AND" in w && Array.isArray((w as { AND: unknown }).AND)) {
    return (w as { AND: Prisma.ScamAlertWhereInput[] }).AND;
  }
  throw new Error("expected AND chain");
}

const now = new Date("2026-05-10T15:00:00.000Z");

describe("buildPublishedScamAlertsWhere", () => {
  it("scopes published and optional exact scam type", () => {
    const w = buildPublishedScamAlertsWhere("all", "phishing", now);
    expect(w).toEqual({
      AND: [buildPublishedActiveScamAlertWhere(now), { scamType: "phishing" }]
    });
  });

  it("adds confidence floor for high risk", () => {
    const w = buildPublishedScamAlertsWhere("high", undefined, now);
    expect(w).toEqual({
      AND: [buildPublishedActiveScamAlertWhere(now), { confidence: { gte: 75 } }]
    });
  });

  it("uses OR for malware keywords", () => {
    const w = buildPublishedScamAlertsWhere("malware", undefined, now);
    const chain = expectAndChain(w);
    expect(chain[0]).toEqual(buildPublishedActiveScamAlertWhere(now));
    const inner = chain[1] as { OR?: unknown[] };
    expect(Array.isArray(inner.OR)).toBe(true);
    expect(inner.OR!.length).toBeGreaterThanOrEqual(3);
  });
});
