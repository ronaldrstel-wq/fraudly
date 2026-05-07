import { describe, expect, it } from "vitest";
import { dedupeSignals, normalizeScamSignal } from "@/lib/scam-alerts/normalize";

describe("scam-alert normalization", () => {
  it("normalizes domains and confidence bounds", () => {
    const normalized = normalizeScamSignal({
      source: "internal",
      url: "https://www.Example.com/path",
      riskLevel: "high",
      confidence: 2,
      evidence: {}
    });
    expect(normalized.normalizedDomain).toBe("example.com");
    expect(normalized.confidence).toBe(1);
  });

  it("deduplicates by source/domain key", () => {
    const rows = dedupeSignals([
      {
        source: "urlhaus",
        sourceRef: "1",
        normalizedDomain: "a.com",
        riskLevel: "high",
        confidence: 0.7,
        evidence: {}
      },
      {
        source: "urlhaus",
        sourceRef: "1",
        normalizedDomain: "a.com",
        riskLevel: "critical",
        confidence: 0.9,
        evidence: {}
      }
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.riskLevel).toBe("critical");
  });
});
