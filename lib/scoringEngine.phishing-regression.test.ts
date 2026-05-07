import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { calculateScamScore, type ScoreSignal } from "@/lib/scoringEngine";
import { trustScoreFromRisk } from "@/lib/trustSystem";
import { BRAND_RULES, TRUST_CEILINGS } from "@/lib/scoring/heuristics";
import type { ReviewSignals } from "@/lib/reviewSignals";

function withTlsFailureSignal(): ScoreSignal[] {
  return [
    {
      id: "intel-no-tls",
      label: "No reliable HTTPS endpoint",
      category: "website_quality",
      impact: 40,
      confidence: "high",
      reason: "Port 443 probe did not complete a TLS session."
    }
  ];
}

function withStrongTechnicalSignals(): ScoreSignal[] {
  return [
    {
      id: "intel-valid-ssl",
      label: "Valid TLS certificate observed",
      category: "website_quality",
      impact: -8,
      confidence: "high",
      reason: "HTTPS handshake succeeded with a certificate trusted by the runtime."
    },
    {
      id: "intel-no-feed-hits-composite",
      label: "No URLhaus/OpenPhish hit and Safe Browsing clean",
      category: "website_quality",
      impact: -4,
      confidence: "medium",
      reason: "Feeds consulted in this run did not produce active listing hits."
    },
    {
      id: "intel-domain-established",
      label: "Long-lived domain registration",
      category: "domain",
      impact: -6,
      confidence: "high",
      reason: "RDAP-derived domain age indicates long-lived registration."
    }
  ];
}

function withYoungDomainSignals(): ScoreSignal[] {
  return [
    {
      id: "intel-domain-very-new",
      label: "Very new registration (RDAP)",
      category: "domain",
      impact: 18,
      confidence: "high",
      reason: "RDAP-derived domain age is very recent."
    },
    {
      id: "intel-short-registration",
      label: "Short RDAP registration window",
      category: "domain",
      impact: 10,
      confidence: "medium",
      reason: "Registration window is short."
    }
  ];
}

function strongReputationSignals(): ReviewSignals {
  return {
    googleFound: true,
    googleRating: 4.6,
    googleReviewCount: 20000,
    trustpilotFound: true,
    trustpilotRating: 4.4,
    trustpilotReviewCount: 5000,
    suspiciousReviewSignals: [],
    sources: ["Google Places API (searchText)", "Outscraper Google Reviews", "Trustpilot"],
    warnings: [],
    outscraper: {
      source: "Outscraper Google Reviews",
      available: true,
      rating: 4.6,
      reviewCount: 12000,
      negativeReviewRatio: 0.07,
      strongestComplaintThemes: [],
      confidence: "high",
      negativeTrend: false,
      suspiciousPositivePattern: false,
      businessIdentityMismatch: false,
      businessAddress: "1 Main Street",
      businessPhone: "+1 555 0000",
      businessCategory: "Payments",
      websiteMatch: true
    }
  };
}

describe("phishing lexical and impersonation regression", () => {
  const suspiciousDomains = [
    "paypal-security-check-example.net",
    "secure-login-paypal-example.com",
    "verify-wallet-airdrop.net",
    "microsoft-auth-check.org",
    "claim-your-refund-fast.biz"
  ];

  it("caps suspicious lexical/impersonation domains to non-trusted outcomes", () => {
    for (const domain of suspiciousDomains) {
      const result = calculateScamScore({
        domain,
        heuristicReasons: [],
        externalSignals: withTlsFailureSignal()
      });
      const trust = trustScoreFromRisk(result.finalScore);
      expect(trust).toBeLessThanOrEqual(40);
      expect(result.verdict).not.toBe("safe");
    }
  });

  it("keeps known legitimate brand domains in safe range", () => {
    const safeDomains = [
      "paypal.com",
      "microsoft.com",
      "google.com",
      "apple.com",
      "amazon.com",
      "netflix.com",
      "facebook.com",
      "instagram.com",
      "whatsapp.com",
      "binance.com",
      "coinbase.com",
      "stripe.com",
      "openai.com",
      "github.com",
      "docusign.com",
      "dropbox.com",
      "adobe.com"
    ];
    for (const domain of safeDomains) {
      const result = calculateScamScore({
        domain,
        heuristicReasons: []
      });
      const trust = trustScoreFromRisk(result.finalScore);
      expect(trust).toBeGreaterThanOrEqual(65);
      expect(result.verdict).toBe("safe");
    }
  });

  it("uses weighted authority recovery without deterministic equal floors", () => {
    const authoritativeDomains = ["paypal.com", "github.com", "stripe.com", "openai.com", "microsoft.com"];
    const trusts: number[] = [];
    for (const domain of authoritativeDomains) {
      const result = calculateScamScore({
        domain,
        heuristicReasons: [],
        externalSignals: withStrongTechnicalSignals(),
        reviewSignals: domain === "paypal.com" ? strongReputationSignals() : undefined
      });
      const trust = trustScoreFromRisk(result.finalScore);
      trusts.push(trust);
      expect(trust).toBeGreaterThanOrEqual(80);
      expect(trust).toBeLessThanOrEqual(96);
      expect(result.verdict).toBe("safe");
      expect(result.confidence).toBe("high");
    }
    const uniqueTrusts = new Set(trusts);
    expect(uniqueTrusts.size).toBeGreaterThan(1);
  });

  it("applies brand impersonation cap for brand+lure on non-official domains", () => {
    const result = calculateScamScore({
      domain: "paypal-verify-login-security-check-example.net",
      heuristicReasons: []
    });
    const trust = trustScoreFromRisk(result.finalScore);
    expect(trust).toBeLessThanOrEqual(TRUST_CEILINGS.brandImpersonation);
    expect(
      result.scoreCapsApplied.some(
        (cap) => cap.cap === TRUST_CEILINGS.brandImpersonation && /Brand impersonation/i.test(cap.reason)
      )
    ).toBe(true);
  });

  it("never blind-whitelists official domains when technical/malware risk exists", () => {
    const tlsFailed = calculateScamScore({
      domain: "paypal.com",
      heuristicReasons: [],
      externalSignals: withTlsFailureSignal()
    });
    expect(trustScoreFromRisk(tlsFailed.finalScore)).toBeLessThanOrEqual(40);

    const malwareFlagged = calculateScamScore({
      domain: "paypal.com",
      heuristicReasons: [],
      externalSignals: [
        {
          id: "intel-safe-browsing-flagged",
          label: "Google Safe Browsing match",
          category: "website_quality",
          impact: 32,
          confidence: "high",
          reason: "Google Safe Browsing reported threats."
        }
      ]
    });
    expect(trustScoreFromRisk(malwareFlagged.finalScore)).toBeLessThanOrEqual(20);
  });

  it("adds bounded reputation and registration trust support for established domains", () => {
    const baseline = calculateScamScore({
      domain: "paypal.com",
      heuristicReasons: [],
      externalSignals: withStrongTechnicalSignals()
    });
    const boosted = calculateScamScore({
      domain: "paypal.com",
      heuristicReasons: [],
      reviewSignals: strongReputationSignals(),
      externalSignals: withStrongTechnicalSignals()
    });

    const baselineTrust = trustScoreFromRisk(baseline.finalScore);
    const boostedTrust = trustScoreFromRisk(boosted.finalScore);
    expect(boostedTrust).toBeGreaterThanOrEqual(baselineTrust);
    expect(boostedTrust).toBeLessThanOrEqual(96);
  });

  it("keeps newly registered suspicious domains low despite superficial trust context", () => {
    const result = calculateScamScore({
      domain: "verify-wallet-airdrop.net",
      heuristicReasons: [],
      reviewSignals: strongReputationSignals(),
      externalSignals: [...withStrongTechnicalSignals(), ...withYoungDomainSignals()]
    });
    const trust = trustScoreFromRisk(result.finalScore);
    expect(trust).toBeLessThanOrEqual(44);
    expect(result.verdict).not.toBe("safe");
  });

  it("uses centralized heuristics config in scoring engine", () => {
    const source = readFileSync(new URL("./scoringEngine.ts", import.meta.url), "utf8");
    expect(source).toContain('from "@/lib/scoring/heuristics"');
    expect(BRAND_RULES.length).toBeGreaterThanOrEqual(19);
  });
});
