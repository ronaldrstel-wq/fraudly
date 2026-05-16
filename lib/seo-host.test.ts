import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CANONICAL_PRODUCTION_HOST,
  isCanonicalProductionRequest,
  isPrivateNoindexPath,
  isProductionPublicSiteHost,
  isWwwFraudlyProductionHost,
  normalizedRequestHost,
  shouldSetPreviewNoindexHeader,
  shouldSetProductionAllHeader
} from "./seo-host";

const prodHost = {
  forwardedHost: null as string | null,
  hostHeader: "fraudly.app",
  urlHostname: CANONICAL_PRODUCTION_HOST
};

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

describe("isPrivateNoindexPath", () => {
  it("flags auth, admin, and api paths", () => {
    expect(isPrivateNoindexPath("/api/check")).toBe(true);
    expect(isPrivateNoindexPath("/sign-in")).toBe(true);
    expect(isPrivateNoindexPath("/")).toBe(false);
    expect(isPrivateNoindexPath("/check/example.com")).toBe(false);
  });
});

describe("shouldSetPreviewNoindexHeader", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("never noindexes fraudly.app when VERCEL_ENV=production", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(shouldSetPreviewNoindexHeader(prodHost)).toBe(false);
    expect(
      shouldSetPreviewNoindexHeader({
        forwardedHost: "fraudly-git-main.vercel.app",
        hostHeader: "fraudly.app",
        urlHostname: CANONICAL_PRODUCTION_HOST
      })
    ).toBe(false);
  });

  it("noindexes fraudly.app when VERCEL_ENV=preview (preview on custom domain)", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(shouldSetPreviewNoindexHeader(prodHost)).toBe(true);
  });

  it("noindexes vercel preview deployment URLs even if NODE_ENV is production", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("NODE_ENV", "production");
    expect(
      shouldSetPreviewNoindexHeader({
        forwardedHost: "fraudly-git-feature.vercel.app",
        hostHeader: "fraudly-git-feature.vercel.app",
        urlHostname: "fraudly-git-feature.vercel.app"
      })
    ).toBe(true);
  });

  it("noindexes localhost regardless of NODE_ENV", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(
      shouldSetPreviewNoindexHeader({
        forwardedHost: null,
        hostHeader: "localhost:3000",
        urlHostname: "localhost"
      })
    ).toBe(true);
  });
});

describe("shouldSetProductionAllHeader", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sets all on canonical production when VERCEL_ENV=production", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(shouldSetProductionAllHeader(prodHost)).toBe(true);
    expect(isCanonicalProductionRequest(prodHost)).toBe(true);
  });

  it("does not set all on preview hosts", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(
      shouldSetProductionAllHeader({
        forwardedHost: "fraudly.vercel.app",
        hostHeader: "fraudly.vercel.app",
        urlHostname: "fraudly.vercel.app"
      })
    ).toBe(false);
  });
});
