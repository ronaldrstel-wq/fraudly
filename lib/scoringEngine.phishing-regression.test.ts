import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { calculateScamScore, type ScoreSignal } from "@/lib/scoringEngine";
import { trustScoreFromRisk } from "@/lib/trustSystem";
import { BRAND_RULES, TRUST_CEILINGS } from "@/lib/scoring/heuristics";

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

  it("uses centralized heuristics config in scoring engine", () => {
    const source = readFileSync(new URL("./scoringEngine.ts", import.meta.url), "utf8");
    expect(source).toContain('from "@/lib/scoring/heuristics"');
    expect(BRAND_RULES.length).toBeGreaterThanOrEqual(19);
  });
});
