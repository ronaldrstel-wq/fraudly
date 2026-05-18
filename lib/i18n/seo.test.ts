import { describe, expect, it } from "vitest";
import { allLocalizedMarketingUrls } from "@/lib/i18n/sitemap-paths";
import { homeScannerHref, isHomepagePath, localizedPath } from "@/lib/i18n/paths";
import { hreflangLanguages, localizedCanonicalUrl, normalizeSearchSuffix } from "@/lib/i18n/seo";
import { LOCALIZED_MARKETING_PATHS, LOCALES } from "@/lib/i18n/locales";
import { SITE_URL } from "@/lib/seo";

describe("localizedPath", () => {
  it("keeps English unprefixed", () => {
    expect(localizedPath("/", "en")).toBe("/");
    expect(localizedPath("/about", "en")).toBe("/about");
    expect(localizedPath("/scam-help", "en")).toBe("/scam-help");
  });

  it("prefixes nl, de, fr, es, pt", () => {
    expect(localizedPath("/", "nl")).toBe("/nl");
    expect(localizedPath("/about", "de")).toBe("/de/about");
    expect(localizedPath("/latest-checks", "fr")).toBe("/fr/latest-checks");
    expect(localizedPath("/support", "es")).toBe("/es/support");
    expect(localizedPath("/scam-help", "pt")).toBe("/pt/scam-help");
  });
});

describe("homeScannerHref", () => {
  it("always targets the locale homepage scanner anchor", () => {
    expect(homeScannerHref("en")).toBe("/#link-check");
    expect(homeScannerHref("nl")).toBe("/nl#link-check");
    expect(homeScannerHref("de")).toBe("/de#link-check");
    expect(homeScannerHref("fr")).toBe("/fr#link-check");
    expect(homeScannerHref("es")).toBe("/es#link-check");
    expect(homeScannerHref("pt")).toBe("/pt#link-check");
  });

  it("does not use the current page path", () => {
    expect(homeScannerHref("en")).not.toContain("/about");
    expect(homeScannerHref("nl")).not.toContain("/about");
    expect(homeScannerHref("de")).not.toContain("/scam-help");
    expect(homeScannerHref("fr")).not.toContain("/latest-checks");
  });
});

describe("isHomepagePath", () => {
  it("matches locale homepages only", () => {
    expect(isHomepagePath("/")).toBe(true);
    expect(isHomepagePath("/nl")).toBe(true);
    expect(isHomepagePath("/de")).toBe(true);
    expect(isHomepagePath("/fr")).toBe(true);
    expect(isHomepagePath("/es")).toBe(true);
    expect(isHomepagePath("/pt")).toBe(true);
  });

  it("rejects marketing subpages and check routes", () => {
    expect(isHomepagePath("/about")).toBe(false);
    expect(isHomepagePath("/nl/about")).toBe(false);
    expect(isHomepagePath("/de/scam-help")).toBe(false);
    expect(isHomepagePath("/fr/latest-checks")).toBe(false);
    expect(isHomepagePath("/scam-alerts")).toBe(false);
    expect(isHomepagePath("/support")).toBe(false);
    expect(isHomepagePath("/check/example.com")).toBe(false);
  });
});

describe("hreflangLanguages", () => {
  it("includes en, nl, de, fr, es, pt and x-default", () => {
    const languages = hreflangLanguages("/about");
    expect(Object.keys(languages).sort()).toEqual(["de", "en", "es", "fr", "nl", "pt", "x-default"].sort());
  });

  it("points x-default and en to unprefixed English URLs", () => {
    const languages = hreflangLanguages("/scam-help");
    expect(languages["x-default"]).toBe(`${SITE_URL}/scam-help`);
    expect(languages.en).toBe(`${SITE_URL}/scam-help`);
    expect(languages.nl).toBe(`${SITE_URL}/nl/scam-help`);
    expect(languages.de).toBe(`${SITE_URL}/de/scam-help`);
    expect(languages.fr).toBe(`${SITE_URL}/fr/scam-help`);
    expect(languages.es).toBe(`${SITE_URL}/es/scam-help`);
    expect(languages.pt).toBe(`${SITE_URL}/pt/scam-help`);
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
  it("lists 36 localized marketing entries (6 paths × 6 locales)", () => {
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
      "/fr/support",
      "/es",
      "/es/about",
      "/pt/latest-checks"
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
