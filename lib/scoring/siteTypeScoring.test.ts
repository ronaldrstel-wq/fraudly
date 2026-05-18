import { describe, expect, it } from "vitest";
import { buildIntelScoring } from "@/lib/checks/scoring";
import type { ExternalChecksResult } from "@/lib/checks/types";
import { classifySiteType } from "@/lib/siteClassification/classifySiteType";
import { calculateScamScore } from "@/lib/scoringEngine";
import { standardVerdictLabel } from "@/lib/scoring/displayScore";
import { buildScoringIdentityContext } from "@/lib/scoringIdentityContext";
import type { ReviewSignals } from "@/lib/reviewSignals";
import { trustScoreFromRisk } from "@/lib/trustSystem";

function checks(ageDays: number): ExternalChecksResult {
  return {
    police: { listedInPoliceScamDatabase: false, source: "test", warnings: [] },
    domainIntelligence: {
      ageDays,
      registrationDate: "2026-01-01T00:00:00.000Z",
      registrar: "Example Registrar",
      source: "RDAP (test)",
      warnings: []
    },
    safeBrowsing: { safeBrowsingStatus: "safe", safeBrowsingThreats: [], source: "test", warnings: [] },
    openPhish: { listed: false, matches: [], source: "test", warnings: [] },
    urlHaus: { listed: false, matches: [], source: "test", warnings: [] },
    ssl: { httpsEnabled: true, validCertificate: true, source: "test", warnings: [] },
    providerEvidence: [],
    warnings: []
  };
}

function poorReviews(): ReviewSignals {
  return {
    googleFound: true,
    googleRating: 2.1,
    googleReviewCount: 200,
    trustpilotFound: true,
    trustpilotRating: 2.3,
    trustpilotReviewCount: 500,
    suspiciousReviewSignals: [],
    sources: [],
    warnings: [],
    publicReviewAvailabilityNotes: [],
    reviewFetchDebug: []
  };
}

const saasPage =
  "Fraudly website trust checker. Sign up free. Pricing plans per month. API documentation and team dashboard. Get started — scan suspicious links before you click.";

const riskyShopPage =
  "90% OFF clearance sale today only! Add to cart. Buy now with bitcoin only. Limited stock. Gucci Prada deals.";

describe("site-type aware scoring", () => {
  it("does not mark a young SaaS site suspicious solely for domain age", () => {
    const domain = "fraudly.app";
    const ageDays = 45;
    const c = checks(ageDays);
    const reviews: ReviewSignals = {
      googleFound: false,
      trustpilotFound: false,
      suspiciousReviewSignals: [],
      sources: [],
      warnings: [],
      publicReviewAvailabilityNotes: [],
      reviewFetchDebug: []
    };
    const ctx = buildScoringIdentityContext(domain, c, reviews);
    const site = classifySiteType({ hostname: domain, pageText: saasPage });
    const score = calculateScamScore({
      domain,
      heuristicReasons: [],
      reviewSignals: reviews,
      websiteText: saasPage,
      scoringContext: ctx,
      externalSignals: [],
      intelSurface: { confirmedMalicious: false, benignTechnicalBaseline: true },
      siteClassification: site
    });

    expect(site.isWebshop).toBe(false);
    const trust = trustScoreFromRisk(score.finalScore);
    expect(trust).toBeGreaterThanOrEqual(50);
    expect(standardVerdictLabel(trust)).not.toBe("Suspicious");
    expect(
      score.signals.some((s) => s.id === "domain-age-limited-history" || s.id === "domain-age-recent-general")
    ).toBe(true);
    expect(score.riskDimensions?.limitedHistoryWarning).toBeTruthy();
  });

  it("flags a young webshop with discounts and weak policies as elevated shopping risk", () => {
    const domain = "flash-lux-deals.xyz";
    const c = checks(14);
    const reviews = poorReviews();
    const ctx = buildScoringIdentityContext(domain, c, reviews);
    const site = classifySiteType({ hostname: domain, pageText: riskyShopPage });
    const score = calculateScamScore({
      domain,
      heuristicReasons: [],
      reviewSignals: reviews,
      supplyChainSignals: {
        likelyDropshipping: true,
        likelyChinaShipping: false,
        likelyLocalProduction: false,
        confidence: "high",
        dropshipConfidence: "high",
        chinaConfidence: "low",
        localConfidence: "low",
        reasons: ["Very large discounts (70%+) were advertised."],
        scoreAdjustment: 10
      },
      websiteText: riskyShopPage,
      scoringContext: ctx,
      externalSignals: [],
      intelSurface: { confirmedMalicious: false, benignTechnicalBaseline: true },
      siteClassification: site
    });

    expect(site.isWebshop).toBe(true);
    expect(["elevated", "high"]).toContain(score.riskDimensions?.shoppingRiskLevel);
    expect(score.signals.some((s) => s.id === "domain-age-very-new-webshop" || s.id === "domain-age-limited-history")).toBe(
      true
    );
  });

  it("keeps americatoday-style established shops mostly safe with customer-experience caution", () => {
    const domain = "americatoday.com";
    const c = checks(5500);
    const reviews = poorReviews();
    const ctx = buildScoringIdentityContext(domain, c, reviews);
    const site = classifySiteType({
      hostname: domain,
      pageText: "Shop now. Add to cart. Checkout with Visa. Shipping and returns policy. Products on sale 20% off."
    });
    const score = calculateScamScore({
      domain,
      heuristicReasons: [],
      reviewSignals: reviews,
      websiteText: "Shop products. Add to cart. Shipping and returns.",
      scoringContext: ctx,
      externalSignals: [],
      intelSurface: { confirmedMalicious: false, benignTechnicalBaseline: true },
      siteClassification: site
    });

    const trust = trustScoreFromRisk(score.finalScore);
    expect(trust).toBeGreaterThanOrEqual(70);
    expect(score.riskDimensions?.customerExperienceWarning).toContain("customer experiences");
    expect(score.riskDimensions?.scamRiskLevel).not.toBe("high");
  });

  it("stays high risk when threat feeds hit regardless of age", () => {
    const domain = "old-listed.example";
    const c = checks(4000);
    const reviews = poorReviews();
    const ctx = buildScoringIdentityContext(domain, c, reviews);
    const { scoreSignals } = buildIntelScoring({
      ...c,
      openPhish: { listed: true, matches: [domain], source: "OpenPhish", warnings: [] }
    });
    const site = classifySiteType({ hostname: domain, pageText: saasPage });
    const score = calculateScamScore({
      domain,
      heuristicReasons: [],
      reviewSignals: reviews,
      websiteText: saasPage,
      scoringContext: ctx,
      externalSignals: scoreSignals,
      intelSurface: { confirmedMalicious: false, benignTechnicalBaseline: true },
      siteClassification: site
    });

    expect(score.riskDimensions?.scamRiskLevel).toBe("high");
    expect(trustScoreFromRisk(score.finalScore)).toBeLessThan(50);
  });
});
