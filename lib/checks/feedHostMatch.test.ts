import { describe, expect, it } from "vitest";
import { feedEntryMatchesHost } from "@/lib/checks/feedHostMatch";

describe("feedEntryMatchesHost", () => {
  it("matches exact host URLs", () => {
    expect(feedEntryMatchesHost("https://coolblue.nl/", "coolblue.nl", "coolblue.nl")).toBe(true);
  });

  it("does not substring-match registrable domain inside unrelated paths", () => {
    expect(
      feedEntryMatchesHost("https://evil.example/phish/coolblue.nl-login", "coolblue.nl", "coolblue.nl")
    ).toBe(false);
  });

  it("matches when feed entry host equals registrable domain", () => {
    expect(feedEntryMatchesHost("https://www.coolblue.nl/checkout", "shop.coolblue.nl", "coolblue.nl")).toBe(true);
  });
});
