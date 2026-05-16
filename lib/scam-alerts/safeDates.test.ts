import { describe, expect, it } from "vitest";
import { formatAlertDateTimeEn, safeAlertDate, safeAlertIso } from "@/lib/scam-alerts/safeDates";

describe("safeDates", () => {
  it("returns null for invalid dates", () => {
    expect(safeAlertDate(new Date("invalid"))).toBeNull();
    expect(safeAlertIso(null)).toBeNull();
  });

  it("formats unknown fallback", () => {
    expect(formatAlertDateTimeEn(null)).toBe("Unknown");
  });
});
