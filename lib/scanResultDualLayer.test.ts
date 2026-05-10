import { describe, expect, it } from "vitest";
import { assessCriticalThreat } from "@/lib/scanPresentation";
import {
  humanRecHeadline,
  humanRecKindFromTrustVerdict,
  resolveHumanRecKind,
  resolveHumanRecKindForBasicCheck,
  shortScanExplanation,
  technicalStatusText
} from "@/lib/scanResultDualLayer";
import { trustLevelFromScore } from "@/lib/trustSystem";

const baseThreatInput = {
  openPhish: { listed: false, matches: [], source: "op", warnings: [] },
  urlHaus: { listed: false, matches: [], source: "uh", warnings: [] },
  police: { listedInPoliceScamDatabase: false, source: "p", warnings: [] },
  safeBrowsing: { safeBrowsingStatus: "safe" as const, safeBrowsingThreats: [], source: "sb", warnings: [] },
  providerEvidence: []
};

describe("scanResultDualLayer", () => {
  it("uses Avoid for phishing-style Tier‑1 intel", () => {
    const r = {
      ...baseThreatInput,
      openPhish: { listed: true, matches: ["https://x"], source: "op", warnings: [] },
      score: 20,
      siteStatus: "unverified" as const
    };
    const t = assessCriticalThreat(r);
    expect(t.active).toBe(true);
    const kind = resolveHumanRecKind({
      threatActive: t.active,
      threatKind: t.kind,
      siteStatus: r.siteStatus,
      trustLevel: trustLevelFromScore(80)
    });
    expect(humanRecHeadline(kind)).toMatch(/Avoid/i);
  });

  it("uses Dangerous Website for URLhaus-style threat", () => {
    const r = {
      ...baseThreatInput,
      urlHaus: { listed: true, matches: ["https://bad"], source: "uh", warnings: [] },
      score: 20,
      siteStatus: "unverified" as const
    };
    const t = assessCriticalThreat(r);
    const kind = resolveHumanRecKind({
      threatActive: t.active,
      threatKind: t.kind,
      siteStatus: r.siteStatus,
      trustLevel: trustLevelFromScore(80)
    });
    expect(humanRecHeadline(kind)).toMatch(/Dangerous/i);
  });

  it("maps basic scam verdict to High Risk headline", () => {
    const k = resolveHumanRecKindForBasicCheck("scam", 90);
    expect(humanRecHeadline(k)).toMatch(/High Risk/i);
  });

  it("exposes technical status from trust band when no threat", () => {
    const tech = technicalStatusText({
      threatActive: false,
      threatKind: null,
      displayTrust: 85,
      siteStatus: "unverified"
    });
    expect(tech).toBe("Likely Legit");
  });

  it("combines low coverage + limited band for longer explanation", () => {
    const line = shortScanExplanation({
      threatActive: false,
      threatKind: null,
      siteStatus: "unverified",
      trustLevel: "limitedEvidence",
      confidenceLevel: "low"
    });
    expect(line.toLowerCase()).toContain("low scan coverage");
  });

  it("derives consumer headline from trust + verdict snapshot", () => {
    const k = humanRecKindFromTrustVerdict(92, "safe");
    expect(humanRecHeadline(k)).toMatch(/Trusted|Looks Safe/);
  });
});
