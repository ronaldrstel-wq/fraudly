import { describe, expect, it } from "vitest";
import {
  consumerDisplayBand,
  getOverviewCardChrome,
  getTrustBandFromScore,
  getTrustColors,
  getTrustColorsForDisplay,
  getTrustPresentation,
  standardVerdictLabel
} from "@/lib/scoring/trust-bands";

describe("trust-bands", () => {
  it("maps score thresholds to five bands", () => {
    expect(getTrustBandFromScore(100)).toBe("likely-safe");
    expect(getTrustBandFromScore(85)).toBe("likely-safe");
    expect(getTrustBandFromScore(84)).toBe("mostly-safe");
    expect(getTrustBandFromScore(70)).toBe("mostly-safe");
    expect(getTrustBandFromScore(69)).toBe("caution");
    expect(getTrustBandFromScore(50)).toBe("caution");
    expect(getTrustBandFromScore(49)).toBe("suspicious");
    expect(getTrustBandFromScore(30)).toBe("suspicious");
    expect(getTrustBandFromScore(29)).toBe("high-risk");
  });

  it("assigns verdict labels aligned with bands", () => {
    expect(standardVerdictLabel(90)).toBe("Likely Safe");
    expect(standardVerdictLabel(75)).toBe("Mostly Safe");
    expect(standardVerdictLabel(74)).toBe("Mostly Safe");
    expect(standardVerdictLabel(60)).toBe("Use Caution");
    expect(standardVerdictLabel(40)).toBe("Suspicious");
    expect(standardVerdictLabel(20)).toBe("High Risk");
  });

  it("does not use safe (green) tone for caution-range scores", () => {
    expect(getTrustPresentation(74).tone).toBe("mostly-safe");
    expect(getTrustPresentation(60).tone).toBe("caution");
    expect(getTrustPresentation(74).colors.progressBar).not.toContain("emerald");
  });

  it("only uses safe tone at 85+", () => {
    expect(getTrustPresentation(85).tone).toBe("safe");
    expect(getTrustPresentation(84).tone).not.toBe("safe");
  });

  it("uses required band descriptions", () => {
    expect(getTrustPresentation(90).description).toBe("No major risk indicators detected.");
    expect(getTrustPresentation(75).description).toContain("Mostly positive signals");
    expect(getTrustPresentation(60).description).toContain("Some risk indicators");
  });

  it("exposes distinct premium overview chrome per band", () => {
    const likely = getOverviewCardChrome(90);
    const mostly = getOverviewCardChrome(77);
    const caution = getOverviewCardChrome(60);
    const suspicious = getOverviewCardChrome(40);
    const danger = getOverviewCardChrome(15);

    expect(likely.cardShell).toContain("emerald");
    expect(mostly.cardShell).toContain("teal");
    expect(caution.cardShell).toContain("amber");
    expect(suspicious.cardShell).toContain("orange");
    expect(danger.cardShell).toContain("rose");

    expect(mostly.cardShell).not.toContain("emerald");
    expect(mostly.scorePill).not.toContain("emerald");
    expect(caution.cardShell).not.toContain("emerald");
    expect(likely.headlineText).not.toEqual(mostly.headlineText);
    expect(mostly.headlineText).not.toEqual(caution.headlineText);
  });

  it("acceptance: score 75 is visibly teal, score 59 is amber, not grey", () => {
    const mostly = getOverviewCardChrome(75);
    const caution = getOverviewCardChrome(59);
    const likely = getOverviewCardChrome(90);

    for (const field of [
      mostly.accentBar,
      mostly.iconWrap,
      mostly.icon,
      mostly.scorePill,
      mostly.metaCta,
      mostly.cardShell,
      mostly.cardShellHover
    ] as const) {
      expect(field).toMatch(/teal/);
      // cardShellHover uses translate-y (contains "slate" as substring — exclude motion tokens)
      const colorField = field === mostly.cardShellHover ? field.replace(/translate/g, "") : field;
      expect(colorField).not.toMatch(/slate|gray|grey|emerald|amber/);
    }

    for (const field of [
      caution.accentBar,
      caution.iconWrap,
      caution.icon,
      caution.scorePill,
      caution.metaCta,
      caution.cardShell
    ] as const) {
      expect(field).toMatch(/amber/);
      expect(field).not.toMatch(/slate|gray|grey|teal/);
    }

    expect(likely.scorePill).toContain("emerald");
    expect(likely.accentBar).toContain("emerald");
    expect(mostly.metaCta).not.toContain("underline");
    expect(getTrustColors(75).metricCard).toContain("teal");
    expect(getTrustColorsForDisplay(75, "Mostly Safe").headlineText).toContain("teal");
    expect(getTrustColorsForDisplay(59, "Use Caution").scorePill).toContain("amber");
  });

  it("uses neutral chrome only when score is missing", () => {
    const missing = getOverviewCardChrome(null);
    expect(missing.cardShell).toContain("slate");
    expect(getOverviewCardChrome(75).cardShell).not.toContain("slate-200/80 bg-white");
  });

  it("maps legacy three-band consumerDisplayBand", () => {
    expect(consumerDisplayBand(90)).toBe("trusted");
    expect(consumerDisplayBand(75)).toBe("trusted");
    expect(consumerDisplayBand(60)).toBe("caution");
    expect(consumerDisplayBand(40)).toBe("caution");
    expect(consumerDisplayBand(20)).toBe("highRisk");
  });
});
