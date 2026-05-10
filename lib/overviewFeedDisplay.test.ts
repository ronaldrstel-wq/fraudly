import { describe, expect, it } from "vitest";
import { overviewFeedPrimaryLine } from "@/lib/overviewFeedDisplay";

describe("overviewFeedPrimaryLine", () => {
  it("returns hostname for http(s) URLs", () => {
    expect(
      overviewFeedPrimaryLine("https://customer-sp-brantison1.pages.dev/path?q=1")
    ).toEqual({
      primary: "customer-sp-brantison1.pages.dev",
      fullTitle: "https://customer-sp-brantison1.pages.dev/path?q=1"
    });
  });

  it("parses bare host-like strings", () => {
    expect(overviewFeedPrimaryLine("login-ledgger-load-io-ios.vercel.app")).toEqual({
      primary: "login-ledgger-load-io-ios.vercel.app",
      fullTitle: "login-ledgger-load-io-ios.vercel.app"
    });
  });

  it("preserves non-URL labels", () => {
    expect(overviewFeedPrimaryLine("Acme Bank Support")).toEqual({
      primary: "Acme Bank Support",
      fullTitle: "Acme Bank Support"
    });
  });
});
