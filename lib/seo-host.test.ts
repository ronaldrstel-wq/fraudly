import { describe, expect, it } from "vitest";
import {
  CANONICAL_PRODUCTION_HOST,
  isProductionPublicSiteHost,
  isWwwFraudlyProductionHost,
  normalizedRequestHost
} from "./seo-host";

describe("normalizedRequestHost", () => {
  it("prefers first x-forwarded-host entry and strips port", () => {
    expect(normalizedRequestHost("WWW.Fraudly.app:443", "ignored")).toBe("www.fraudly.app");
    expect(normalizedRequestHost("app-xyz.vercel.app", "localhost")).toBe("app-xyz.vercel.app");
  });

  it("falls back to url hostname when forwarded is empty", () => {
    expect(normalizedRequestHost(null, "LocalHost")).toBe("localhost");
    expect(normalizedRequestHost("", "127.0.0.1")).toBe("127.0.0.1");
  });
});

describe("isWwwFraudlyProductionHost", () => {
  it("matches only normalized www production host", () => {
    expect(isWwwFraudlyProductionHost("www.fraudly.app")).toBe(true);
    expect(isWwwFraudlyProductionHost("fraudly.app")).toBe(false);
    expect(isWwwFraudlyProductionHost("my-project.vercel.app")).toBe(false);
  });
});

describe("isProductionPublicSiteHost", () => {
  it("treats apex and www as production", () => {
    expect(isProductionPublicSiteHost(CANONICAL_PRODUCTION_HOST)).toBe(true);
    expect(isProductionPublicSiteHost(`www.${CANONICAL_PRODUCTION_HOST}`)).toBe(true);
    expect(isProductionPublicSiteHost("preview.vercel.app")).toBe(false);
  });
});
