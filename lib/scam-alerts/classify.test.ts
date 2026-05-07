import { describe, expect, it } from "vitest";
import { classifySignals } from "@/lib/scam-alerts/classify";

describe("classifySignals", () => {
  it("classifies wallet recovery as crypto wallet scam", () => {
    const out = classifySignals([
      {
        source: "internal",
        domain: "urgent-wallet-recovery.click",
        riskLevel: "high",
        confidence: 0.8,
        evidence: {}
      }
    ]);
    expect(out[0]?.scamType).toBe("crypto wallet scam");
  });

  it("extracts affected brand when present", () => {
    const out = classifySignals([
      {
        source: "phishtank",
        domain: "paypal-security-check.example",
        riskLevel: "critical",
        confidence: 0.9,
        evidence: {}
      }
    ]);
    expect(out[0]?.affectedBrand).toBe("paypal");
  });
});
