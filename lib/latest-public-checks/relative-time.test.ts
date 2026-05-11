import { describe, expect, it } from "vitest";
import { formatPublicCheckRelativeTime } from "@/lib/latest-public-checks/relative-time";

describe("formatPublicCheckRelativeTime", () => {
  const base = new Date("2026-05-11T12:00:00.000Z").getTime();

  it("shows just now under one minute", () => {
    expect(formatPublicCheckRelativeTime(new Date(base - 30_000).toISOString(), base)).toBe("just now");
  });

  it("formats minutes with singular", () => {
    expect(formatPublicCheckRelativeTime(new Date(base - 60_000).toISOString(), base)).toBe("1 min ago");
    expect(formatPublicCheckRelativeTime(new Date(base - 12 * 60_000).toISOString(), base)).toBe("12 min ago");
  });

  it("formats hours below 24", () => {
    expect(formatPublicCheckRelativeTime(new Date(base - 3600_000).toISOString(), base)).toBe("1 hr ago");
    expect(formatPublicCheckRelativeTime(new Date(base - 5 * 3600_000).toISOString(), base)).toBe("5 hr ago");
    expect(formatPublicCheckRelativeTime(new Date(base - 23 * 3600_000).toISOString(), base)).toBe("23 hr ago");
  });

  it("uses days from 24 hours up to 47h59m", () => {
    expect(formatPublicCheckRelativeTime(new Date(base - 24 * 3600_000).toISOString(), base)).toBe("1 day ago");
    expect(formatPublicCheckRelativeTime(new Date(base - 30 * 3600_000).toISOString(), base)).toBe("1 day ago");
    expect(formatPublicCheckRelativeTime(new Date(base - 47 * 3600_000 - 59 * 60_000).toISOString(), base)).toBe("1 day ago");
  });

  it("uses plural days from 48 hours", () => {
    expect(formatPublicCheckRelativeTime(new Date(base - 48 * 3600_000).toISOString(), base)).toBe("2 days ago");
    expect(formatPublicCheckRelativeTime(new Date(base - 72 * 3600_000).toISOString(), base)).toBe("3 days ago");
  });

  it("does not show 30 hr ago", () => {
    expect(formatPublicCheckRelativeTime(new Date(base - 30 * 3600_000).toISOString(), base)).not.toMatch(/hr/);
    expect(formatPublicCheckRelativeTime(new Date(base - 30 * 3600_000).toISOString(), base)).toBe("1 day ago");
  });
});
