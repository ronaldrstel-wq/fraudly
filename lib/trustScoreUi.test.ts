import { describe, expect, it } from "vitest";
import { getTrustDescription, getTrustLabel, getTrustTone, trustUiTierFromScore } from "@/lib/trustScoreUi";

describe("trustScoreUi", () => {
  it("maps example scores to labels", () => {
    expect(getTrustLabel(92)).toBe("Looks safe");
    expect(getTrustLabel(73)).toBe("Looks mostly safe");
    expect(getTrustLabel(58)).toBe("Be careful");
    expect(getTrustLabel(41)).toBe("Risky");
    expect(getTrustLabel(18)).toBe("High risk");
  });

  it("maps boundary scores to tiers", () => {
    expect(trustUiTierFromScore(80)).toBe("safe");
    expect(trustUiTierFromScore(79)).toBe("mostlySafe");
    expect(trustUiTierFromScore(65)).toBe("mostlySafe");
    expect(trustUiTierFromScore(64)).toBe("caution");
    expect(trustUiTierFromScore(50)).toBe("caution");
    expect(trustUiTierFromScore(49)).toBe("risky");
    expect(trustUiTierFromScore(30)).toBe("risky");
    expect(trustUiTierFromScore(29)).toBe("highRisk");
  });

  it("uses required copy for safe and mostly safe descriptions", () => {
    expect(getTrustDescription(92)).toBe(
      "This website shows multiple positive trust indicators and no major scam signals were detected in this scan."
    );
    expect(getTrustDescription(73)).toBe(
      "No major scam signals were detected in this scan, although some checks were limited or worth reviewing."
    );
  });

  it("aliases getTrustTone to tier", () => {
    expect(getTrustTone(73)).toBe("mostlySafe");
  });
});
