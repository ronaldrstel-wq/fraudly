import { describe, expect, it } from "vitest";
import { getTrustDescription, getTrustLabel, getTrustTone, trustUiTierFromScore } from "@/lib/trustScoreUi";

describe("trustScoreUi", () => {
  it("maps example scores to labels", () => {
    expect(getTrustLabel(92)).toBe("Likely Safe");
    expect(getTrustLabel(75)).toBe("Mostly Safe");
    expect(getTrustLabel(60)).toBe("Use Caution");
    expect(getTrustLabel(40)).toBe("Suspicious");
    expect(getTrustLabel(18)).toBe("High Risk");
  });

  it("maps boundary scores to tiers", () => {
    expect(trustUiTierFromScore(85)).toBe("safe");
    expect(trustUiTierFromScore(84)).toBe("mostlySafe");
    expect(trustUiTierFromScore(70)).toBe("mostlySafe");
    expect(trustUiTierFromScore(69)).toBe("caution");
    expect(trustUiTierFromScore(50)).toBe("caution");
    expect(trustUiTierFromScore(49)).toBe("risky");
    expect(trustUiTierFromScore(30)).toBe("risky");
    expect(trustUiTierFromScore(29)).toBe("highRisk");
  });

  it("uses required copy for safe and mostly safe descriptions", () => {
    expect(getTrustDescription(92)).toBe("No major risk indicators detected.");
    expect(getTrustDescription(75)).toBe(
      "Mostly positive signals detected, but some checks were limited or unavailable."
    );
  });

  it("aliases getTrustTone to tier", () => {
    expect(getTrustTone(73)).toBe("mostlySafe");
  });
});
