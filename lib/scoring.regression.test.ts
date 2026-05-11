import { describe, expect, it } from "vitest";
import { buildNonexistentWebsiteResult } from "@/lib/analysis/nonexistentWebsiteResult";
import { buildIntelScoring } from "@/lib/checks/scoring";
import type { ExternalChecksResult } from "@/lib/checks/types";
import { buildDomainInfrastructure } from "@/lib/domainInfrastructure";
import { analyzeDomainPatterns } from "@/lib/domainPatternHeuristics";
import { EN_MESSAGES } from "@/lib/messages.en";
import { calculateScamScore } from "@/lib/scoringEngine";
import { buildScoringIdentityContext } from "@/lib/scoringIdentityContext";
import type { ReviewSignals } from "@/lib/reviewSignals";
import {
  collectMaliciousSignals,
  deriveSiteStatus,
  isConfirmedMalicious,
  isProbablyInactiveWebsite
} from "@/lib/siteOutcome";
import type { SupplyChainSignals } from "@/lib/supplyChainSignals";
import { trustLevelFromScore, trustScoreFromRisk } from "@/lib/trustSystem";

function emptySupplyChainSignals(): SupplyChainSignals {
  return {
    likelyDropshipping: false,
    likelyChinaShipping: false,
    likelyLocalProduction: false,
    confidence: "low",
    dropshipConfidence: "low",
    chinaConfidence: "low",
    localConfidence: "low",
    reasons: [],
    scoreAdjustment: 0
  };
}

function emptyReviews(extra?: Partial<ReviewSignals>): ReviewSignals {
  return {
    googleFound: false,
    trustpilotFound: false,
    suspiciousReviewSignals: [],
    sources: [],
    warnings: [],
    publicReviewAvailabilityNotes: [],
    reviewFetchDebug: [],
    ...extra
  };
}

function minimalExternal(di: ExternalChecksResult["domainIntelligence"]): ExternalChecksResult {
  return {
    police: { listedInPoliceScamDatabase: false, source: "Police", warnings: [] },
    domainIntelligence: di,
    safeBrowsing: {
      safeBrowsingStatus: "unknown",
      safeBrowsingThreats: [],
      source: "SafeBrowsing",
      warnings: []
    },
    openPhish: { listed: false, matches: [], source: "OpenPhish", warnings: [] },
    urlHaus: { listed: false, matches: [], source: "URLhaus", warnings: [] },
    ssl: {
      httpsEnabled: true,
      validCertificate: true,
      source: "TLS",
      warnings: []
    },
    providerEvidence: [],
    warnings: []
  };
}

describe("trust scoring regressions", () => {
  it("does not treat substring ‘bank’ inside a single brand token as phishing diction by itself", () => {
    expect(analyzeDomainPatterns("checkout.bankofamerica.com").fakeAuthoritySubstringInApex).toBe(false);
    expect(analyzeDomainPatterns("bankofamerica.com").fakeAuthoritySubstringInApex).toBe(false);
  });

  it("A) nh.govxwqy.cam is capped well below Trusted", () => {
    const domain = "nh.govxwqy.cam";
    const checks = minimalExternal({
      source: "RDAP (rdap.org)",
      warnings: ["ENOTFOUND simulation"]
    });
    const reviews = emptyReviews({
      suspiciousReviewSignals: [EN_MESSAGES.reviewEvidence.noPublicReviewProfile]
    });
    const ctx = buildScoringIdentityContext(domain, checks, reviews);
    const { scoreSignals: external } = buildIntelScoring(checks);
    const out = calculateScamScore({
      domain,
      heuristicReasons: [],
      reviewSignals: reviews,
      scoringContext: ctx,
      externalSignals: external
    });
    const trust = trustScoreFromRisk(out.finalScore);
    expect(trust).toBeLessThanOrEqual(35);
    expect(trustLevelFromScore(trust)).toMatch(/suspicious|highRisk/);
    expect(out.verdict).toBe("scam");
    expect(out.signals.some((s) => /ownership could not be verified/i.test(s.label))).toBe(true);
    expect(
      out.signals.some(
        (s) =>
          s.id === "domain-hard-commodity-tld" ||
          s.id.startsWith("domain-fake-authority") ||
          s.id === "domain-multi-signal-gibberish"
      )
    ).toBe(true);
  });

  it("B) example.com preserves healthy RDAP semantics and benign TLD tier", () => {
    const domain = "example.com";
    const checks = minimalExternal({
      source: "RDAP",
      warnings: [],
      registrationDate: "2000-01-01T00:00:00.000Z",
      registrar: "RESERVED INTERNET ASSIGNMENT PARAMETER REGISTRY",
      ageDays: 9000
    });
    const reviews = emptyReviews({ suspiciousReviewSignals: [EN_MESSAGES.reviewEvidence.noPublicReviewProfile] });
    const ctx = buildScoringIdentityContext(domain, checks, reviews);
    expect(analyzeDomainPatterns(domain).fakeAuthoritySubstringInApex).toBe(false);

    const { scoreSignals: external } = buildIntelScoring(checks);
    const out = calculateScamScore({
      domain,
      heuristicReasons: [],
      reviewSignals: reviews,
      scoringContext: ctx,
      externalSignals: external
    });

    expect(out.trustScoreCap).toBe(100);
    const trust = trustScoreFromRisk(out.finalScore);
    expect(trust).toBeGreaterThanOrEqual(80);
    expect(analyzeDomainPatterns(domain).tldRiskTier).toBe("none");
    expect(analyzeDomainPatterns(domain).hasStrongLexicalSuspicion).toBe(false);
  });

  it("B2) Nonexistent apex never surfaces a consumer trust gauge and is not optimistic", () => {
    const infra = buildDomainInfrastructure({
      dnsResolvable: false,
      domainIntelligence: { source: "RDAP stub", warnings: [] },
      ssl: {
        httpsEnabled: false,
        validCertificate: false,
        source: "TLS stub",
        warnings: []
      }
    });
    expect(infra.treatAsNonExistentHost).toBe(true);

    const externalChecks = minimalExternal({
      source: "RDAP stub",
      warnings: [],
      registrationDate: undefined,
      registrar: undefined,
      ageDays: undefined
    });
    externalChecks.ssl = {
      httpsEnabled: false,
      validCertificate: false,
      source: "TLS stub",
      warnings: []
    };

    const res = buildNonexistentWebsiteResult({
      normalizedDomain: "totally-unused-random-zz9.example",
      externalChecks,
      reviewSignals: emptyReviews(),
      supplyChainSignals: emptySupplyChainSignals(),
      domainInfrastructure: infra,
      trustSignals: [],
      intelScoreBreakdown: buildIntelScoring(externalChecks).breakdown
    });

    expect(res.siteStatus).toBe("nonexistent");
    expect(res.omitTrustScoreGauge).toBe(true);
    expect(trustScoreFromRisk(res.score)).not.toBe(100);
  });

  it("C) parked / inactive snapshot maps to inactive lifecycle status", () => {
    const dns = true;
    const infra = buildDomainInfrastructure({
      dnsResolvable: dns,
      domainIntelligence: { source: "RDAP stub", warnings: [], ageDays: 4000 },
      ssl: {
        httpsEnabled: false,
        validCertificate: false,
        source: "TLS stub",
        warnings: ["timeout"]
      }
    });
    expect(infra.treatAsNonExistentHost).toBe(false);

    const inactive = isProbablyInactiveWebsite({
      dnsResolvable: dns,
      treatAsNonexistent: infra.treatAsNonExistentHost,
      websiteSignals: null,
      ssl: {
        httpsEnabled: false,
        validCertificate: false,
        source: "TLS stub",
        warnings: []
      }
    });
    expect(inactive).toBe(true);

    const domain = "parked-holder.example-regression.test";
    const checks = minimalExternal({
      source: "RDAP stub",
      warnings: [],
      ageDays: 4000,
      registrar: "Example",
      registrationDate: "2020-01-01T00:00:00.000Z"
    });
    checks.ssl = {
      httpsEnabled: false,
      validCertificate: false,
      source: "TLS stub",
      warnings: ["timeout"]
    };
    const reviews = emptyReviews();
    const malicious = collectMaliciousSignals(checks);
    expect(isConfirmedMalicious(malicious)).toBe(false);
    const ctx = buildScoringIdentityContext(domain, checks, reviews);
    const score = calculateScamScore({
      domain,
      heuristicReasons: [],
      reviewSignals: reviews,
      scoringContext: ctx,
      externalSignals: buildIntelScoring(checks).scoreSignals
    });
    const status = deriveSiteStatus({
      scoreRisk: score.finalScore,
      malicious,
      treatAsNonexistent: false,
      inactiveWebsite: inactive,
      ctx,
      reviewSignals: reviews
    });
    expect(status).toBe("inactive");
  });

  it("D) youthful legitimate-style domain avoids automatic high‑risk labeling", () => {
    const domain = "payments-new-shop-demo.com";
    const checks = minimalExternal({
      source: "RDAP",
      warnings: [],
      registrationDate: "2026-03-01T00:00:00.000Z",
      registrar: "Generic Registrar LLC",
      ageDays: 40,
      suspiciouslyShortRegistration: false,
      hasPrivacyProtection: true
    });
    const reviews = emptyReviews({
      suspiciousReviewSignals: [EN_MESSAGES.reviewEvidence.noPublicReviewProfile]
    });
    const ctx = buildScoringIdentityContext(domain, checks, reviews);
    const out = calculateScamScore({
      domain,
      heuristicReasons: [],
      reviewSignals: reviews,
      scoringContext: ctx,
      externalSignals: buildIntelScoring(checks).scoreSignals,
      supplyChainSignals: emptySupplyChainSignals()
    });

    expect(analyzeDomainPatterns(domain).combinedGibberishApex).toBe(false);
    const trust = trustScoreFromRisk(out.finalScore);
    expect(trust).toBeGreaterThanOrEqual(50);
    const malicious = collectMaliciousSignals(checks);
    expect(isConfirmedMalicious(malicious)).toBe(false);

    const siteStatus = deriveSiteStatus({
      scoreRisk: out.finalScore,
      malicious,
      treatAsNonexistent: false,
      inactiveWebsite: false,
      ctx,
      reviewSignals: reviews
    });
    expect(["caution", "unverified"]).toContain(siteStatus);
  });

  it("E) brandable soft TLD domains are not blasted to high lexical risk purely from TLD tier", () => {
    const domain = "happycrafts.xyz";
    const checks = minimalExternal({
      source: "RDAP",
      warnings: [],
      ageDays: 600,
      registrationDate: "2024-01-01T00:00:00.000Z",
      registrar: "Example Cloud LLC",
      hasPrivacyProtection: false
    });

    expect(analyzeDomainPatterns(domain).tldRiskTier).toBe("soft");
    expect(analyzeDomainPatterns(domain).hasStrongLexicalSuspicion).toBe(false);

    const reviews = emptyReviews({
      suspiciousReviewSignals: [EN_MESSAGES.reviewEvidence.noPublicReviewProfile]
    });

    const ctx = buildScoringIdentityContext(domain, checks, reviews);
    const score = calculateScamScore({
      domain,
      heuristicReasons: [],
      reviewSignals: reviews,
      scoringContext: ctx,
      externalSignals: buildIntelScoring(checks).scoreSignals
    });
    expect(trustLevelFromScore(trustScoreFromRisk(score.finalScore))).not.toBe("highRisk");
  });

  it("F) official Dutch treasury host bypasses spoofing penalties", () => {
    expect(analyzeDomainPatterns("belastingdienst.nl").officialRegistrableExempt).toBe(true);
    expect(analyzeDomainPatterns("belastingdienst.nl").fakeAuthoritySubstringInApex).toBe(false);

    const domain = "belastingdienst.nl";
    const checks = minimalExternal({
      source: "RDAP",
      warnings: [],
      ageDays: 5000,
      registrationDate: "2010-01-01T00:00:00.000Z",
      registrar: "Belasting CC",
      hasPrivacyProtection: true
    });
    const reviews = emptyReviews();
    const malicious = collectMaliciousSignals(checks);
    expect(isConfirmedMalicious(malicious)).toBe(false);

    expect(
      deriveSiteStatus({
        scoreRisk: calculateScamScore({
          domain,
          heuristicReasons: [],
          reviewSignals: reviews,
          scoringContext: buildScoringIdentityContext(domain, checks, reviews),
          externalSignals: buildIntelScoring(checks).scoreSignals
        }).finalScore,
        malicious,
        treatAsNonexistent: false,
        inactiveWebsite: false,
        ctx: buildScoringIdentityContext(domain, checks, reviews),
        reviewSignals: reviews
      })
    ).toBe("trusted");
  });

  it("G) confirmed feed signals lock confirmed_malicious site status plus OpenPhish evidence tier", () => {
    const domain = "phish-kit.example.invalid";
    const checks = minimalExternal({
      source: "RDAP",
      warnings: [],
      ageDays: 900
    });
    checks.openPhish = { listed: true, matches: ["https://phish-kit.example.invalid/login"], source: "OpenPhish", warnings: [] };

    expect(collectMaliciousSignals(checks).openPhishListed).toBe(true);

    const reviews = emptyReviews();
    const ctx = buildScoringIdentityContext(domain, checks, reviews);
    const out = calculateScamScore({
      domain,
      heuristicReasons: [],
      reviewSignals: reviews,
      scoringContext: ctx,
      externalSignals: buildIntelScoring(checks).scoreSignals
    });

    const intel = buildIntelScoring(checks).breakdown;
    expect(intel.some((row) => row.id === "intel-openphish-listed" && row.evidenceTier === "confirmed_malicious")).toBe(true);

    const status = deriveSiteStatus({
      scoreRisk: out.finalScore,
      malicious: collectMaliciousSignals(checks),
      treatAsNonexistent: false,
      inactiveWebsite: false,
      ctx,
      reviewSignals: reviews
    });
    expect(status).toBe("confirmed_malicious");
    expect(out.verdict).toBe("scam");
  });

  it("Anchored reputation can still reach Trusted with scoring context attached", () => {
    const domain = "payments.example-charity.test";
    const checks = minimalExternal({
      source: "RDAP",
      warnings: [],
      registrationDate: "2018-01-01T00:00:00.000Z",
      registrar: "Good Registrar LLC",
      ageDays: 2000,
      suspiciouslyShortRegistration: false,
      hasPrivacyProtection: false
    });
    const reviews = emptyReviews({
      googleFound: true,
      googleRating: 4.6,
      googleReviewCount: 300,
      trustpilotFound: false
    });

    reviews.suspiciousReviewSignals = [];

    const ctx = buildScoringIdentityContext(domain, checks, reviews);
    const out = calculateScamScore({
      domain,
      heuristicReasons: [],
      reviewSignals: reviews,
      scoringContext: ctx,
      externalSignals: buildIntelScoring(checks).scoreSignals
    });
    const trust = trustScoreFromRisk(out.finalScore);
    expect(trust).toBeGreaterThanOrEqual(80);
    expect(trustLevelFromScore(trust)).toBe("trusted");
  });

  it("HTTPS with failed RDAP and no reputation never reaches Trusted (TLS-only is not endorsement)", () => {
    const domain = "payments-brand-lite.example";
    const checks = minimalExternal({
      source: "RDAP (rdap.org)",
      warnings: ["Timeout contacting RDAP"],
      registrationDate: undefined,
      registrar: undefined,
      ageDays: undefined
    });

    expect(analyzeDomainPatterns(domain).hasStrongLexicalSuspicion).toBe(false);

    const reviews = emptyReviews({ suspiciousReviewSignals: [EN_MESSAGES.reviewEvidence.noPublicReviewProfile] });
    const ctx = buildScoringIdentityContext(domain, checks, reviews);
    const { scoreSignals } = buildIntelScoring(checks);
    const out = calculateScamScore({
      domain,
      heuristicReasons: [],
      reviewSignals: reviews,
      scoringContext: ctx,
      externalSignals: scoreSignals,
      intelSurface: { confirmedMalicious: false, benignTechnicalBaseline: true }
    });
    expect(out.verdict).not.toBe("safe");
    const trust = trustScoreFromRisk(out.finalScore);
    expect(trust).toBeLessThanOrEqual(79);
    expect(trustLevelFromScore(trust)).not.toBe("trusted");
    expect(scoreSignals.every((s) => s.id !== "intel-valid-ssl")).toBe(true);
  });

  it("H) benign apex with TLS baseline, RDAP failed, no threat feeds: not scam verdict", () => {
    const domain = "plainshop.nl";
    const checks = minimalExternal({
      source: "RDAP (rdap.org)",
      warnings: ["ETIMEDOUT"],
      registrationDate: undefined,
      registrar: undefined,
      ageDays: undefined
    });
    const reviews = emptyReviews();
    const ctx = buildScoringIdentityContext(domain, checks, reviews);
    const { scoreSignals } = buildIntelScoring(checks);
    const out = calculateScamScore({
      domain,
      heuristicReasons: [],
      reviewSignals: reviews,
      scoringContext: ctx,
      externalSignals: scoreSignals,
      intelSurface: { confirmedMalicious: false, benignTechnicalBaseline: true },
      mailDnsHints: { mxConfigured: true, hasSpf: true, hasDmarc: true }
    });
    const trust = trustScoreFromRisk(out.finalScore);
    expect(out.verdict).not.toBe("scam");
    expect(trust).toBeGreaterThanOrEqual(42);
    expect(["suspicious", "highRisk"]).toContain(trustLevelFromScore(trust));
  });

  it("J) Very young RDAP age with HTTPS and no feeds: not automatic scam verdict", () => {
    const domain = "freshshop.example";
    const checks = minimalExternal({
      source: "RDAP",
      warnings: [],
      ageDays: 10,
      registrationDate: "2026-04-01T00:00:00.000Z",
      registrar: "Example Registrar",
      hasPrivacyProtection: false,
      suspiciouslyShortRegistration: false
    });
    const reviews = emptyReviews();
    const ctx = buildScoringIdentityContext(domain, checks, reviews);
    const out = calculateScamScore({
      domain,
      heuristicReasons: [],
      reviewSignals: reviews,
      scoringContext: ctx,
      externalSignals: buildIntelScoring(checks).scoreSignals,
      intelSurface: { confirmedMalicious: false, benignTechnicalBaseline: true }
    });
    expect(out.verdict).not.toBe("scam");
    expect(trustScoreFromRisk(out.finalScore)).toBeGreaterThanOrEqual(35);
  });
});
