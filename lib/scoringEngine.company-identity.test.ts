import { describe, expect, it } from "vitest";
import { calculateScamScore } from "@/lib/scoringEngine";
import { trustLevelFromScore, trustScoreFromRisk } from "@/lib/trustSystem";

describe("company identity verification", () => {
  it("legitimate Dutch store with consistent KVK/VAT-style data remains low risk", () => {
    const result = calculateScamScore({
      domain: "legit-dutch-store.nl",
      heuristicReasons: [],
      websiteText:
        "Official Dutch brand based in Amsterdam. Company name: Legit Dutch Store B.V. " +
        "Legal entity: Legit Dutch Store B.V. Registered address: Keizersgracht 10, 1015CJ Amsterdam, Netherlands. " +
        "Return address: Keizersgracht 10, 1015CJ Amsterdam, Netherlands. KVK: 12345678 VAT: NL123456789B01. " +
        "Support: support@legit-dutch-store.nl Phone: +31 20 123 4567",
      reviewSignals: {
        googleFound: true,
        googleRating: 4.4,
        googleReviewCount: 240,
        trustpilotFound: true,
        trustpilotRating: 4.3,
        trustpilotReviewCount: 180,
        suspiciousReviewSignals: [],
        sources: ["fixture"],
        warnings: []
      }
    });

    expect(result.companyIdentitySignals.confidence).toMatch(/medium|high/);
    expect(result.companyIdentitySignals.riskSignals.length).toBeLessThanOrEqual(1);
    expect(result.companyIdentitySignals.positiveSignals.length).toBeGreaterThan(2);
    expect(result.riskLabels).not.toContain("Missing company identity");
    expect(result.finalScore).toBeLessThan(30);
  });

  it("small store with limited info but no contradiction gets mild penalty only", () => {
    const result = calculateScamScore({
      domain: "smallcrafts-shop.com",
      heuristicReasons: [],
      websiteText:
        "Small family store. Contact us at hello@smallcrafts-shop.com. Shipping 5-9 business days. " +
        "Returns accepted within 14 days.",
      reviewSignals: {
        googleFound: true,
        googleRating: 4.2,
        googleReviewCount: 52,
        trustpilotFound: false,
        suspiciousReviewSignals: [],
        sources: ["fixture"],
        warnings: []
      }
    });

    expect(result.companyIdentitySignals.confidence).toMatch(/low|medium/);
    expect(result.companyIdentitySignals.riskSignals.filter((r) => r.includes("Missing company identity")).length).toBeLessThanOrEqual(1);
    expect(result.finalScore).toBeLessThan(45);
  });

  it("fake Amsterdam brand with no KVK, China return, free email and inconsistent names becomes high risk", () => {
    const result = calculateScamScore({
      domain: "amsterdam-luxemode.com",
      heuristicReasons: [],
      websiteText:
        "Proud Amsterdam brand. Company name: Luxe Mode. Legal entity: Trendline Commerce Ltd. " +
        "Return address: No. 8 Longhua Rd Shenzhen China. Support: supportluxemode@gmail.com. " +
        "No KVK or VAT listed. Shipping 10-20 business days.",
      supplyChainSignals: {
        likelyDropshipping: true,
        likelyChinaShipping: true,
        likelyLocalProduction: false,
        confidence: "high",
        dropshipConfidence: "high",
        chinaConfidence: "high",
        localConfidence: "low",
        reasons: ["china-linked returns"],
        scoreAdjustment: 28
      },
      reviewSignals: {
        googleFound: true,
        googleRating: 2.8,
        googleReviewCount: 94,
        trustpilotFound: true,
        trustpilotRating: 2.7,
        trustpilotReviewCount: 210,
        suspiciousReviewSignals: ["dropshipping complaints", "no refund"],
        sources: ["fixture"],
        warnings: []
      }
    });

    expect(result.companyIdentitySignals.confidence).toMatch(/medium|high/);
    expect(result.companyIdentitySignals.riskSignals).toEqual(
      expect.arrayContaining(["Brand location mismatch", "Inconsistent legal entity", "Free email provider used"])
    );
    expect(result.riskLabels).toEqual(
      expect.arrayContaining(["Brand location mismatch", "Inconsistent legal entity", "Free email provider used"])
    );
    expect(trustLevelFromScore(trustScoreFromRisk(result.finalScore))).not.toBe("trusted");
    expect(result.finalScore).toBeGreaterThanOrEqual(45);
  });

  it("malformed VAT/KVK numbers trigger registration format issue", () => {
    const result = calculateScamScore({
      domain: "bad-registry-format.com",
      heuristicReasons: [],
      websiteText:
        "Company name: Registry Co. KVK: 12A45 VAT: N123-INVALID Support: help@bad-registry-format.com " +
        "Legal address: Main Street 1, Rotterdam, Netherlands",
      reviewSignals: {
        googleFound: false,
        trustpilotFound: false,
        suspiciousReviewSignals: [],
        sources: ["fixture"],
        warnings: []
      }
    });

    expect(result.companyIdentitySignals.riskSignals).toContain("Registration format issue");
    expect(result.riskLabels).toContain("Registration format issue");
  });

  it("consistent legal identity with international fulfillment avoids major penalty by itself", () => {
    const result = calculateScamScore({
      domain: "global-brand-eu.com",
      heuristicReasons: [],
      websiteText:
        "EU brand based in Berlin. Legal entity: Global Brand EU GmbH. " +
        "Legal address: Friedrichstrasse 10, Berlin, Germany. VAT: DE123456789. " +
        "Support: support@global-brand-eu.com. Fulfillment from international warehouse. Shipping 8-15 business days.",
      reviewSignals: {
        googleFound: true,
        googleRating: 4.1,
        googleReviewCount: 130,
        trustpilotFound: false,
        suspiciousReviewSignals: [],
        sources: ["fixture"],
        warnings: []
      }
    });

    expect(result.companyIdentitySignals.riskSignals).not.toContain("Brand location mismatch");
    expect(result.signals.some((s) => s.id === "company-identity-risk")).toBe(false);
  });
});

