import { describe, expect, it } from "vitest";
import { formatDomainAgeFromDays } from "@/lib/format/domainAge";

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

  it("clamps negative values", () => {
    expect(formatDomainAgeFromDays(-5)).toBe("0 days");
  });
});
