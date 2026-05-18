import { describe, expect, it } from "vitest";
import {
  DOMAIN_AGE_NOT_VERIFIED_LABEL,
  domainAgeConsumerBucket,
  formatDomainAgeFromDays,
  formatDomainAgeMetric,
  formatDomainAgeMetricFromSources,
  formatDomainAgeSignal,
  resolveDomainAgeDays
} from "@/lib/format/domainAge";

describe("formatDomainAgeFromDays", () => {
  it("formats 12 days", () => {
    expect(formatDomainAgeFromDays(12)).toBe("12 days");
  });

  it("formats 1 day singular", () => {
    expect(formatDomainAgeFromDays(1)).toBe("1 day");
  });

  it("formats 45 days as months and days", () => {
    expect(formatDomainAgeFromDays(45)).toBe("1 month, 15 days");
  });

  it("formats 438 days as years, months, days", () => {
    expect(formatDomainAgeFromDays(438)).toBe("1 year, 2 months, 13 days");
  });

  it("returns null for missing values", () => {
    expect(formatDomainAgeFromDays(null)).toBeNull();
    expect(formatDomainAgeFromDays(undefined)).toBeNull();
    expect(formatDomainAgeFromDays(Number.NaN)).toBeNull();
  });

  it("returns null for negative values", () => {
    expect(formatDomainAgeFromDays(-1)).toBeNull();
    expect(formatDomainAgeFromDays(-5)).toBeNull();
  });
});

describe("formatDomainAgeSignal", () => {
  it("formats young domain copy", () => {
    expect(formatDomainAgeSignal(12)).toBe(
      "This website is relatively new (12 days), so there is limited public history."
    );
  });

  it("formats mid-age domain copy", () => {
    expect(formatDomainAgeSignal(45)).toBe(
      "This website is relatively new (1 month, 15 days), so there is limited public history."
    );
  });

  it("formats established domain copy", () => {
    expect(formatDomainAgeSignal(438)).toBe("This domain has existed for 1 year, 2 months, 13 days.");
  });

  it("returns null when age unknown", () => {
    expect(formatDomainAgeSignal(null)).toBeNull();
  });
});

describe("resolveDomainAgeDays", () => {
  it("prefers explicit ageDays", () => {
    expect(resolveDomainAgeDays({ ageDays: 438 })).toBe(438);
  });

  it("reads domainAgeDays alias", () => {
    expect(resolveDomainAgeDays({ domainAgeDays: 90 })).toBe(90);
  });

  it("derives age from registrationDate when days missing", () => {
    const registered = new Date();
    registered.setUTCDate(registered.getUTCDate() - 45);
    expect(resolveDomainAgeDays({ registrationDate: registered.toISOString() })).toBe(45);
  });

  it("returns null when no usable fields", () => {
    expect(resolveDomainAgeDays({})).toBeNull();
    expect(resolveDomainAgeDays(null)).toBeNull();
  });
});

describe("formatDomainAgeMetric", () => {
  it("shows formatted age when days available", () => {
    expect(formatDomainAgeMetric({ ageDays: 12 })).toBe("12 days");
    expect(formatDomainAgeMetric({ ageDays: 438 })).toBe("1 year, 2 months, 13 days");
  });

  it("shows Not verified when age unavailable", () => {
    expect(formatDomainAgeMetric({})).toBe(DOMAIN_AGE_NOT_VERIFIED_LABEL);
    expect(formatDomainAgeMetric(null)).toBe(DOMAIN_AGE_NOT_VERIFIED_LABEL);
  });

  it("never shows raw day counts in metric output", () => {
    const label = formatDomainAgeMetric({ ageDays: 8000 });
    expect(label).not.toMatch(/^\d+$/);
    expect(label).toMatch(/year/i);
  });

  it("merges layered sources", () => {
    expect(
      formatDomainAgeMetricFromSources({ ageDays: undefined }, { domainAgeDays: 30 })
    ).toBe("30 days");
  });
});

describe("domainAgeConsumerBucket", () => {
  it("marks young domains as caution", () => {
    expect(domainAgeConsumerBucket(12)).toBe("caution");
  });

  it("marks mid-age domains as caution", () => {
    expect(domainAgeConsumerBucket(90)).toBe("caution");
  });

  it("marks established domains as positive", () => {
    expect(domainAgeConsumerBucket(200)).toBe("positive");
    expect(domainAgeConsumerBucket(438)).toBe("positive");
  });
});
