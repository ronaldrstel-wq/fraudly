import { describe, expect, it } from "vitest";
import {
  PUBLIC_SNAPSHOT_LABEL_STRONG_RISK,
  verdictFromPublicSnapshotLabel
} from "@/lib/latest-public-checks/status-label";
import {
  buildOverviewFromPublicCheck,
  buildOverviewFromTrustAndVerdict,
  humanRecKindFromScamAlertType,
  isCriticalOverviewKind,
  trustScoreFromRiskSnapshot
} from "@/lib/overviewCardPresentation";

describe("overviewCardPresentation", () => {
  it("infers scam snapshot and maps to critical consumer kind", () => {
    expect(verdictFromPublicSnapshotLabel(PUBLIC_SNAPSHOT_LABEL_STRONG_RISK)).toBe("scam");
    const m = buildOverviewFromPublicCheck({ riskScoreSnapshot: 88, statusLabel: PUBLIC_SNAPSHOT_LABEL_STRONG_RISK });
    expect(m.isCritical).toBe(true);
    expect(m.headline).toBe("High Risk");
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
});
