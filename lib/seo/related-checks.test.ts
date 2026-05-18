import { describe, expect, it } from "vitest";
import type { PublicCheckLinkItem } from "@/lib/seo/public-check-links";
import { pickPeopleAlsoChecked, pickRelatedPublicChecks } from "@/lib/seo/related-checks";

function item(domain: string, trustScore: number, band: PublicCheckLinkItem["trustBand"]): PublicCheckLinkItem {
  return {
    id: domain,
    domain,
    displayLabel: domain,
    href: `/check/${domain}`,
    trustScore,
    verdictLabel: "Test",
    trustBand: band,
    scorePillClass: "",
    stripeClass: ""
  };
}

describe("pickRelatedPublicChecks", () => {
  it("excludes the current domain", () => {
    const pool = [
      item("shop-a.com", 30, "high-risk"),
      item("shop-b.com", 35, "high-risk"),
      item("safe.example", 90, "likely-safe")
    ];
    const related = pickRelatedPublicChecks("shop-a.com", pool, 5);
    expect(related.every((r) => r.domain !== "shop-a.com")).toBe(true);
  });

  it("prefers same trust band and TLD", () => {
    const pool = [
      item("alpha-shop.nl", 40, "high-risk"),
      item("beta-shop.nl", 42, "high-risk"),
      item("gamma.com", 41, "high-risk"),
      item("delta-shop.nl", 95, "likely-safe")
    ];
    const related = pickRelatedPublicChecks("alpha-shop.nl", pool, 3);
    expect(related[0]?.domain).toBe("beta-shop.nl");
  });
});

describe("pickPeopleAlsoChecked", () => {
  it("returns recent items without the current domain", () => {
    const pool = [item("a.com", 50, "caution"), item("b.com", 60, "caution"), item("c.com", 70, "mostly-safe")];
    const also = pickPeopleAlsoChecked("b.com", pool, 2);
    expect(also).toHaveLength(2);
    expect(also.map((x) => x.domain)).toEqual(["a.com", "c.com"]);
  });
});
