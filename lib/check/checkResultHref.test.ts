import { describe, expect, it } from "vitest";
import { checkResultHref } from "@/lib/check/checkResultHref";

describe("checkResultHref", () => {
  it("builds domain-only path", () => {
    expect(checkResultHref("example.com")).toBe("/check/example.com");
  });

  it("encodes domain and adds scanId + from", () => {
    expect(checkResultHref("sub.example.com", { scanId: "ck_abc", from: "latest-card" })).toBe(
      "/check/sub.example.com?scanId=ck_abc&from=latest-card"
    );
  });

  it("adds from without scanId for recent searches", () => {
    expect(checkResultHref("shop.test", { from: "recent" })).toBe("/check/shop.test?from=recent");
  });
});
