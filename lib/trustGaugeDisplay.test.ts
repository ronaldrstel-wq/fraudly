import { describe, expect, it } from "vitest";
import { publicTrustGaugeDisplay, shouldShowTrustGauge, trustGaugePercentFromResult } from "@/lib/trustGaugeDisplay";

describe("trustGaugeDisplay", () => {
  it("normal suspicious domain still shows trust gauge", () => {
    const r = { score: 72, omitTrustScoreGauge: false as const };
    expect(shouldShowTrustGauge(r)).toBe(true);
    expect(publicTrustGaugeDisplay(r)).toBe(28);
    expect(trustGaugePercentFromResult(r)).toBe(28);
  });

  it("inactive snapshot with numeric risk still shows gauge", () => {
    const r = { score: 55, omitTrustScoreGauge: false as const };
    expect(shouldShowTrustGauge(r)).toBe(true);
    expect(publicTrustGaugeDisplay(r)).toBe(45);
  });

  it("nonexplicit omit (legacy / cached) still shows gauge", () => {
    const r = { score: 60 };
    expect(shouldShowTrustGauge(r)).toBe(true);
    expect(publicTrustGaugeDisplay(r)).toBe(40);
  });

  it("nonexistent / invalid policy hides gauge only when omitTrustScoreGauge is explicitly true", () => {
    const r = { score: 94, omitTrustScoreGauge: true as const };
    expect(shouldShowTrustGauge(r)).toBe(false);
    expect(publicTrustGaugeDisplay(r)).toBeNull();
  });

  it("does not suppress for low confidence or statuses — only explicit omit", () => {
    expect(
      shouldShowTrustGauge({
        score: 48,
        omitTrustScoreGauge: undefined
      })
    ).toBe(true);
    expect(
      shouldShowTrustGauge({
        score: 81,
        omitTrustScoreGauge: false
      })
    ).toBe(true);
  });

  it("invalid numeric score hides gauge without explicit omit", () => {
    expect(shouldShowTrustGauge({ score: Number.NaN })).toBe(false);
    expect(publicTrustGaugeDisplay({ score: Number.NaN })).toBeNull();
  });
});
