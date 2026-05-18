import { describe, expect, it } from "vitest";
import {
  getScamHelpCountryByCode,
  getScamHelpCountryBySlug,
  SCAM_HELP_COUNTRIES,
  SCAM_HELP_COUNTRY_SLUGS,
  scamHelpCountryPath,
  toCountrySummary
} from "@/lib/scam-help/countries";

describe("scam-help countries", () => {
  it("includes ten supported countries", () => {
    expect(SCAM_HELP_COUNTRIES.map((c) => c.code)).toEqual([
      "NL",
      "GB",
      "DE",
      "US",
      "BE",
      "FR",
      "ES",
      "IT",
      "CA",
      "AU"
    ]);
  });

  it("includes detail-page slugs for NL, GB, DE, US", () => {
    expect(SCAM_HELP_COUNTRY_SLUGS).toEqual([
      "netherlands",
      "united-kingdom",
      "germany",
      "united-states"
    ]);
  });

  it("each country has reporting links", () => {
    for (const country of SCAM_HELP_COUNTRIES) {
      expect(country.reportingLinks.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("detail pages have faqs and common scams", () => {
    for (const country of SCAM_HELP_COUNTRIES.filter((c) => c.detail)) {
      expect(country.detail!.faqs.length).toBeGreaterThanOrEqual(1);
      expect(country.detail!.commonScams.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("external links use https", () => {
    for (const country of SCAM_HELP_COUNTRIES) {
      for (const link of country.reportingLinks) {
        if (link.url) {
          expect(link.url.startsWith("https://")).toBe(true);
        }
      }
    }
  });

  it("resolves country by slug and code", () => {
    expect(getScamHelpCountryBySlug("netherlands")?.name).toBe("Netherlands");
    expect(getScamHelpCountryByCode("NL")?.slug).toBe("netherlands");
    expect(scamHelpCountryPath("germany")).toBe("/scam-help/germany");
    expect(getScamHelpCountryBySlug("invalid")).toBeUndefined();
  });

  it("summary includes hasDetailPage flag", () => {
    const nl = getScamHelpCountryByCode("NL")!;
    const be = getScamHelpCountryByCode("BE")!;
    expect(toCountrySummary(nl).hasDetailPage).toBe(true);
    expect(toCountrySummary(be).hasDetailPage).toBe(false);
  });
});
