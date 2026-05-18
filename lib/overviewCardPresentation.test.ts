import { describe, expect, it } from "vitest";
import {
  PUBLIC_SNAPSHOT_LABEL_STRONG_RISK,
  verdictFromPublicSnapshotLabel
} from "@/lib/latest-public-checks/status-label";
import {
  buildOverviewFromPublicCheck,
  buildOverviewFromRecentSearch,
  buildOverviewFromTrustAndVerdict,
  humanRecKindFromScamAlertType,
  isCriticalOverviewKind,
  resolveRecentSearchTrustScore,
  trustScoreFromRiskSnapshot
} from "@/lib/overviewCardPresentation";
import { getOverviewCardChrome } from "@/lib/scoring/trust-bands";

describe("overviewCardPresentation", () => {
  it("infers scam snapshot and maps to critical consumer kind", () => {
    expect(verdictFromPublicSnapshotLabel(PUBLIC_SNAPSHOT_LABEL_STRONG_RISK)).toBe("scam");
    const m = buildOverviewFromPublicCheck({ riskScoreSnapshot: 88, statusLabel: PUBLIC_SNAPSHOT_LABEL_STRONG_RISK });
    expect(m.isCritical).toBe(true);
    expect(m.headline).toBe("High Risk");
  });

  it("feed overview trusts risk snapshot over misleading statusLabel", () => {
    const m = buildOverviewFromPublicCheck({
      riskScoreSnapshot: 20,
      statusLabel: PUBLIC_SNAPSHOT_LABEL_STRONG_RISK
    });
    expect(m.trustScore).toBe(80);
    expect(m.verdictLabel).toBe("Mostly Safe");
    expect(m.isCritical).toBe(false);
  });

  it("feed overview prefers aligned normalized trust/risk columns", () => {
    const m = buildOverviewFromPublicCheck({
      riskScoreSnapshot: 20,
      statusLabel: PUBLIC_SNAPSHOT_LABEL_STRONG_RISK,
      normalizedTrustScore: 80,
      normalizedRiskScore: 20,
      consumerVerdictLabel: "Mostly Safe"
    });
    expect(m.trustScore).toBe(80);
    expect(m.verdictLabel).toBe("Mostly Safe");
    expect(m.isCritical).toBe(false);
  });

  it("feed overview reconciles drifted trust column against snapshot risk", () => {
    const m = buildOverviewFromPublicCheck({
      riskScoreSnapshot: 88,
      statusLabel: PUBLIC_SNAPSHOT_LABEL_STRONG_RISK,
      normalizedTrustScore: 80,
      consumerVerdictLabel: "Mostly Safe"
    });
    expect(m.trustScore).toBe(12);
    expect(m.verdictLabel).toBe("High Risk");
  });

  it("computes trust from risk snapshot", () => {
    expect(trustScoreFromRiskSnapshot(20)).toBe(80);
  });

  it("marks malware-ish scam types as Dangerous Website presentation", () => {
    expect(humanRecKindFromScamAlertType("Malware campaign")).toBe("dangerousWebsite");
    expect(isCriticalOverviewKind(humanRecKindFromScamAlertType("Malware"))).toBe(true);
  });

  it("uses non-critical band for benign snapshot", () => {
    const m = buildOverviewFromTrustAndVerdict(86, "safe");
    expect(m.isCritical).toBe(false);
    expect(m.headline).toBe("Likely Safe");
    expect(m.verdictLabel).toBe("Likely Safe");
    expect(m.presentationTone).toBe("safe");
  });

  it("uses mostly-safe presentation for mid-high trust", () => {
    const m = buildOverviewFromTrustAndVerdict(75, "safe");
    expect(m.verdictLabel).toBe("Mostly Safe");
    expect(m.presentationTone).toBe("mostly-safe");
  });

  it("recent search overview uses trust-band chrome from stored snap", () => {
    const teal = buildOverviewFromRecentSearch({ trustScoreSnap: 75, verdictSnap: "safe" });
    expect(teal.trustScore).toBe(75);
    expect(teal.verdictLabel).toBe("Mostly Safe");
    expect(getOverviewCardChrome(teal.trustScore).cardShell).toContain("teal");

    const amber = buildOverviewFromRecentSearch({ trustScoreSnap: 59, verdictSnap: "suspicious" });
    expect(getOverviewCardChrome(amber.trustScore).cardShell).toContain("amber");

    const green = buildOverviewFromRecentSearch({ trustScoreSnap: 88, verdictSnap: "safe" });
    expect(getOverviewCardChrome(green.trustScore).cardShell).toContain("emerald");
  });

  it("resolveRecentSearchTrustScore prefers snap over legacy verdict", () => {
    expect(resolveRecentSearchTrustScore({ trustScoreSnap: 75, verdictSnap: "scam" })).toBe(75);
    expect(resolveRecentSearchTrustScore({ trustScoreSnap: null, verdictSnap: "safe" })).toBe(90);
  });
});
