import { describe, expect, it } from "vitest";
import { applyScamAlertFeedQuality } from "@/lib/scam-alerts/feedQuality";
import type { PublicScamAlertListItem } from "@/lib/scam-alerts/service";

function row(p: Partial<PublicScamAlertListItem> & Pick<PublicScamAlertListItem, "id" | "domain" | "sourceName">): PublicScamAlertListItem {
  return {
    title: "t",
    slug: `s-${p.id}`,
    summary: "sum",
    scamType: "phishing",
    affectedBrand: null,
    url: null,
    sourceUrl: null,
    confidence: 80,
    evidenceCount: 1,
    status: "published",
    publishedAt: new Date("2026-05-10T12:00:00.000Z"),
    firstSeenAt: new Date("2026-05-09T12:00:00.000Z"),
    lastSeenAt: new Date("2026-05-10T12:00:00.000Z"),
    ...p
  };
}

describe("applyScamAlertFeedQuality", () => {
  it("keeps one alert per normalized domain (newest wins)", () => {
    const older = row({
      id: "a",
      domain: "www.evil.example",
      sourceName: "S1",
      publishedAt: new Date("2026-05-09T12:00:00.000Z"),
      lastSeenAt: new Date("2026-05-09T12:00:00.000Z")
    });
    const newer = row({
      id: "b",
      domain: "evil.example",
      sourceName: "S2",
      publishedAt: new Date("2026-05-10T14:00:00.000Z"),
      lastSeenAt: new Date("2026-05-10T14:00:00.000Z")
    });
    const out = applyScamAlertFeedQuality([older, newer]);
    expect(out.map((r) => r.id)).toEqual(["b"]);
  });

  it("allows up to three rows per root domain and source", () => {
    const base = { sourceName: "FeedA", domain: "a.phish.example" };
    const r = [1, 2, 3, 4].map((n) =>
      row({
        id: `x${n}`,
        ...base,
        domain: `h${n}.phish.example`,
        publishedAt: new Date(`2026-05-10T${10 + n}:00:00.000Z`)
      })
    );
    const out = applyScamAlertFeedQuality(r);
    expect(out).toHaveLength(3);
    expect(out.map((o) => o.id)).toEqual(["x4", "x3", "x2"]);
  });
});
