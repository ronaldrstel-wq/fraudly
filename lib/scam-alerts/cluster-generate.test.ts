import { describe, expect, it } from "vitest";
import { clusterSignals } from "@/lib/scam-alerts/cluster";
import { generateAlertDrafts } from "@/lib/scam-alerts/generate-alerts";

describe("cluster + alert generation", () => {
  it("creates alerts when evidence threshold is met", async () => {
    const clusters = clusterSignals([
      {
        source: "internal",
        normalizedDomain: "verify-account-now.top",
        scamType: "fake login verification",
        riskLevel: "high",
        confidence: 0.8,
        evidence: {}
      },
      {
        source: "urlhaus",
        normalizedDomain: "verify-account-now.top",
        scamType: "fake login verification",
        riskLevel: "critical",
        confidence: 0.95,
        evidence: {}
      }
    ]);
    const drafts = await generateAlertDrafts(clusters);
    expect(drafts.length).toBeGreaterThan(0);
    expect(drafts[0]?.shouldPublish).toBe(true);
  });
});
