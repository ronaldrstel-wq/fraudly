import { describe, expect, it } from "vitest";
import { buildIntelScoring } from "@/lib/checks/scoring";
import type { ExternalChecksResult } from "@/lib/checks/types";
import { detectFakeWebshopSignals } from "@/lib/fake-webshop/detect";
import {
  assessEstablishedWebshopLegitimacy,
  hasThreatFeedScamHit
} from "@/lib/scoring/establishedWebshop";
import { calculateScamScore } from "@/lib/scoringEngine";
import { standardVerdictLabel } from "@/lib/scoring/displayScore";
import { buildScoringIdentityContext } from "@/lib/scoringIdentityContext";
import type { ReviewSignals } from "@/lib/reviewSignals";
import { trustScoreFromRisk } from "@/lib/trustSystem";

function cleanChecks(ageDays: number): ExternalChecksResult {
  return {
    police: { listedInPoliceScamDatabase: false, source: "test", warnings: [] },
    domainIntelligence: {
      ageDays,
      registrationDate: "2015-01-01T00:00:00.000Z",
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
    googleRating: 2.2,
    googleReviewCount: 120,
    trustpilotFound: true,
    trustpilotRating: 2.4,
    trustpilotReviewCount: 800,
    suspiciousReviewSignals: [],
    sources: [],
    warnings: [],
    publicReviewAvailabilityNotes: [],
    reviewFetchDebug: []
  };
}

describe("established webshop legitimacy", () => {
  it("marks long-running clean domains as eligible", () => {
    const checks = cleanChecks(4000);
    const reviews = poorReviews();
    const ctx = buildScoringIdentityContext("americatoday.com", checks, reviews);
    const leg = assessEstablishedWebshopLegitimacy({
      scoringContext: ctx,
      intelSurface: { confirmedMalicious: false, benignTechnicalBaseline: true },
      patterns: ctx.domainPatterns,
      externalSignals: []
    });
    expect(leg.eligible).toBe(true);
    expect(leg.tier).toBe("very_strong");
  });

  it("rejects threat-feed hits", () => {
    const checks = cleanChecks(4000);
    const reviews = poorReviews();
    const ctx = buildScoringIdentityContext("shop.example", checks, reviews);
    const { scoreSignals } = buildIntelScoring({
      ...checks,
      openPhish: { listed: true, matches: ["https://shop.example"], source: "OpenPhish", warnings: [] }
    });
    expect(hasThreatFeedScamHit(scoreSignals)).toBe(true);
    const leg = assessEstablishedWebshopLegitimacy({
      scoringContext: ctx,
      intelSurface: { confirmedMalicious: false, benignTechnicalBaseline: true },
      patterns: ctx.domainPatterns,
      externalSignals: scoreSignals
    });
    expect(leg.eligible).toBe(false);
  });
});

describe("established webshop scoring calibration", () => {
  it("keeps established shops with poor reviews out of suspicious range", () => {
    const domain = "americatoday.com";
    const checks = cleanChecks(5500);
    const reviews = poorReviews();
    const ctx = buildScoringIdentityContext(domain, checks, reviews);
    const score = calculateScamScore({
      domain,
      heuristicReasons: [],
      reviewSignals: reviews,
      supplyChainSignals: {
        likelyDropshipping: true,
        likelyChinaShipping: false,
        likelyLocalProduction: false,
        confidence: "medium",
        dropshipConfidence: "medium",
        chinaConfidence: "low",
        localConfidence: "low",
        reasons: ["Very large discounts (70%+) were advertised."],
        scoreAdjustment: 8
      },
      websiteText: "90% off clearance sale — shop now",
      externalSignals: [],
      scoringContext: ctx,
      intelSurface: { confirmedMalicious: false, benignTechnicalBaseline: true }
    });

    const trustScore = trustScoreFromRisk(score.finalScore);
    const label = standardVerdictLabel(trustScore);
    expect(trustScore).toBeGreaterThanOrEqual(70);
    expect(label).toMatch(/Mostly Safe|Likely Safe/);
    expect(score.signals.some((s) => s.id === "reviews-trustpilot-poor" && s.reason.includes("customer experiences"))).toBe(
      true
    );
    expect(score.signals.some((s) => s.id === "supply-dropshipping" && s.impact > 0)).toBe(false);
  });

  it("still flags young domains with discounts and supply-chain risk", () => {
    const domain = "flash-deals-shop.xyz";
    const checks = cleanChecks(12);
    const reviews = poorReviews();
    const ctx = buildScoringIdentityContext(domain, checks, reviews);
    const score = calculateScamScore({
      domain,
      heuristicReasons: [],
      reviewSignals: reviews,
      supplyChainSignals: {
        likelyDropshipping: true,
        likelyChinaShipping: true,
        likelyLocalProduction: false,
        confidence: "high",
        dropshipConfidence: "high",
        chinaConfidence: "high",
        localConfidence: "low",
        reasons: ["Very large discounts (70%+) were advertised."],
        scoreAdjustment: 12
      },
      websiteText: "90% off gucci prada clearance",
      externalSignals: [],
      scoringContext: ctx,
      intelSurface: { confirmedMalicious: false, benignTechnicalBaseline: true }
    });

    const trustScore = trustScoreFromRisk(score.finalScore);
    expect(trustScore).toBeLessThan(70);
    expect(score.signals.some((s) => s.id === "supply-dropshipping")).toBe(true);
  });

  it("does not apply trust floor when OpenPhish lists the domain", () => {
    const domain = "old-but-listed.example";
    const checks = cleanChecks(3000);
    const reviews = poorReviews();
    const ctx = buildScoringIdentityContext(domain, checks, reviews);
    const { scoreSignals } = buildIntelScoring({
      ...checks,
      openPhish: { listed: true, matches: [domain], source: "OpenPhish", warnings: [] }
    });
    const score = calculateScamScore({
      domain,
      heuristicReasons: [],
      reviewSignals: reviews,
      externalSignals: scoreSignals,
      scoringContext: ctx,
      intelSurface: { confirmedMalicious: false, benignTechnicalBaseline: true }
    });

    expect(trustScoreFromRisk(score.finalScore)).toBeLessThan(70);
  });

  it("skips discount hype penalty on established domains in fake-webshop detect", () => {
    const r = detectFakeWebshopSignals({
      url: "https://americatoday.com",
      pageText: "90% off clearance sale today only",
      domainAgeDays: 2000
    });
    expect(r.signals.some((s) => s.id === "discount_hype")).toBe(false);
  });
});
