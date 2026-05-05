import { describe, expect, it } from "vitest";
import { buildIntelScoring, buildTrustSignalsFromEvidence } from "@/lib/checks/scoring";
import type { ExternalChecksResult } from "@/lib/checks/types";
import type { ProviderEvidenceResult } from "@/lib/checks/providers/types";

function baseChecks(): ExternalChecksResult {
  return {
    police: { listedInPoliceScamDatabase: false, source: "Dutch Police (public pages)", warnings: [] },
    domainIntelligence: {
      source: "RDAP",
      warnings: [],
      ageDays: 400,
      hasPrivacyProtection: false,
      suspiciouslyShortRegistration: false
    },
    safeBrowsing: {
      safeBrowsingStatus: "unknown",
      safeBrowsingThreats: [],
      source: "Google Safe Browsing",
      warnings: []
    },
    openPhish: { listed: false, matches: [], source: "OpenPhish", warnings: [] },
    urlHaus: { listed: false, matches: [], source: "URLhaus", warnings: [] },
    ssl: {
      httpsEnabled: true,
      validCertificate: true,
      certificateIssuer: "CN=Test CA",
      certificateExpiry: new Date(Date.now() + 86400000).toISOString(),
      source: "TLS certificate check",
      warnings: []
    },
    providerEvidence: [],
    warnings: []
  };
}

describe("buildIntelScoring", () => {
  it("adds HTTPS trust adjustment when TLS validates", () => {
    const { breakdown, scoreSignals } = buildIntelScoring(baseChecks());
    expect(scoreSignals.some((s) => s.id === "intel-valid-ssl")).toBe(true);
    expect(breakdown.find((b) => b.id === "intel-valid-ssl")?.impact).toBeLessThan(0);
  });

  it("does not add composite 'no hits' bonus when Safe Browsing is unknown", () => {
    const { scoreSignals } = buildIntelScoring(baseChecks());
    expect(scoreSignals.some((s) => s.id === "intel-no-feed-hits-composite")).toBe(false);
  });

  it("flags stacked intel sources", () => {
    const flagged = baseChecks();
    flagged.safeBrowsing = {
      safeBrowsingStatus: "flagged",
      safeBrowsingThreats: ["SOCIAL_ENGINEERING"],
      source: "Google Safe Browsing",
      warnings: []
    };
    flagged.urlHaus = { listed: true, matches: ["https://evil/example"], source: "URLhaus", warnings: [] };
    const { scoreSignals } = buildIntelScoring(flagged);
    expect(scoreSignals.some((s) => s.id === "intel-safe-browsing-flagged")).toBe(true);
    expect(scoreSignals.some((s) => s.id === "intel-urlhaus-listed")).toBe(true);
  });
});

describe("buildTrustSignalsFromEvidence", () => {
  it("orders danger ahead of informational rows", () => {
    const rows: ProviderEvidenceResult[] = [
      {
        source: "A",
        category: "domain",
        severity: "info",
        matched: false,
        title: "info",
        description: "desc",
        confidence: "medium"
      },
      {
        source: "B",
        category: "malware",
        severity: "danger",
        matched: true,
        title: "danger",
        description: "desc",
        confidence: "high"
      }
    ];
    const trust = buildTrustSignalsFromEvidence(rows);
    expect(trust[0]?.type).toBe("danger");
  });
});
