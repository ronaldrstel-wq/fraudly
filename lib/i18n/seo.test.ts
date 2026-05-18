import { describe, expect, it } from "vitest";
import { allLocalizedMarketingUrls } from "@/lib/i18n/sitemap-paths";
import { localizedPath } from "@/lib/i18n/paths";
import { hreflangLanguages, localizedCanonicalUrl, normalizeSearchSuffix } from "@/lib/i18n/seo";
import { LOCALIZED_MARKETING_PATHS, LOCALES } from "@/lib/i18n/locales";
import { SITE_URL } from "@/lib/seo";

describe("localizedPath", () => {
  it("keeps English unprefixed", () => {
    expect(localizedPath("/", "en")).toBe("/");
    expect(localizedPath("/about", "en")).toBe("/about");
    expect(localizedPath("/scam-help", "en")).toBe("/scam-help");
  });

  it("prefixes nl, de, fr", () => {
    expect(localizedPath("/", "nl")).toBe("/nl");
    expect(localizedPath("/about", "de")).toBe("/de/about");
    expect(localizedPath("/latest-checks", "fr")).toBe("/fr/latest-checks");
  });
});

describe("hreflangLanguages", () => {
  it("includes en, nl, de, fr and x-default", () => {
    const languages = hreflangLanguages("/about");
    expect(Object.keys(languages).sort()).toEqual(["de", "en", "fr", "nl", "x-default"].sort());
  });

  it("points x-default and en to unprefixed English URLs", () => {
    const languages = hreflangLanguages("/scam-help");
    expect(languages["x-default"]).toBe(`${SITE_URL}/scam-help`);
    expect(languages.en).toBe(`${SITE_URL}/scam-help`);
    expect(languages.nl).toBe(`${SITE_URL}/nl/scam-help`);
    expect(languages.de).toBe(`${SITE_URL}/de/scam-help`);
    expect(languages.fr).toBe(`${SITE_URL}/fr/scam-help`);
  });

  it("preserves query strings across locales", () => {
    const languages = hreflangLanguages("/latest-checks", "page=2");
    expect(languages.en).toBe(`${SITE_URL}/latest-checks?page=2`);
    expect(languages.nl).toBe(`${SITE_URL}/nl/latest-checks?page=2`);
  });
});

describe("localizedCanonicalUrl", () => {
  it("builds locale-appropriate canonical URLs", () => {
    expect(localizedCanonicalUrl("/", "en")).toBe(`${SITE_URL}/`);
    expect(localizedCanonicalUrl("/", "nl")).toBe(`${SITE_URL}/nl`);
    expect(localizedCanonicalUrl("/support", "fr")).toBe(`${SITE_URL}/fr/support`);
  });
});

describe("normalizeSearchSuffix", () => {
  it("accepts bare or leading-question-mark query strings", () => {
    expect(normalizeSearchSuffix("")).toBe("");
    expect(normalizeSearchSuffix("page=2")).toBe("?page=2");
    expect(normalizeSearchSuffix("?page=2")).toBe("?page=2");
  });
});

describe("sitemap marketing URLs", () => {
  it("lists 24 localized marketing entries (6 paths × 4 locales)", () => {
    const urls = allLocalizedMarketingUrls();
    const expected = [
      "/",
      "/about",
      "/scam-help",
      "/scam-alerts",
      "/latest-checks",
      "/support",
      "/nl",
      "/nl/about",
      "/nl/scam-help",
      "/nl/scam-alerts",
      "/nl/latest-checks",
      "/nl/support",
      "/de",
      "/de/about",
      "/fr/support"
    ];
    for (const path of expected) {
      expect(urls).toContain(path);
    }
  });
});

describe("allLocalizedMarketingUrls", () => {
  it("includes every locale for each marketing path", () => {
    const urls = allLocalizedMarketingUrls();
    expect(urls).toHaveLength(LOCALIZED_MARKETING_PATHS.length * LOCALES.length);
  });

  it("includes localized home and subpages without /check routes", () => {
    const urls = allLocalizedMarketingUrls();
    expect(urls).toContain("/");
    expect(urls).toContain("/nl");
    expect(urls).toContain("/de/scam-alerts");
    expect(urls).toContain("/fr/latest-checks");
    expect(urls.some((u) => u.includes("/check"))).toBe(false);
  });
});
