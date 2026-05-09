import { describe, expect, it } from "vitest";
import { detectSocialAdRisk } from "@/lib/social-ad/detect";

describe("detectSocialAdRisk", () => {
  it("flags brand mismatch between ad and domain", () => {
    const r = detectSocialAdRisk({
      platform: "instagram",
      adText: "Official Nike store 95% off — click here!!!",
      url: "https://totally-unrelated-shop.xyz",
      domain: "totally-unrelated-shop.xyz"
    });
    expect(r.riskDelta).toBeGreaterThanOrEqual(4);
    expect(r.riskDelta).toBeLessThanOrEqual(20);
  });

  it("respects upper cap 20", () => {
    const r = detectSocialAdRisk({
      platform: "facebook",
      adText:
        "Congratulations you won free iphone verify your account suspended 90% off pay shipping only bitcoin double your btc",
      url: "https://evil.example/login",
      domain: "evil.example"
    });
    expect(r.riskDelta).toBeLessThanOrEqual(20);
    expect(r.riskDelta).toBeGreaterThanOrEqual(10);
  });

  it("returns zero delta for empty ad without platform context", () => {
    const r = detectSocialAdRisk({
      platform: "unknown",
      adText: "",
      url: "https://example.com",
      domain: "example.com"
    });
    expect(r.riskDelta).toBe(0);
  });
});
