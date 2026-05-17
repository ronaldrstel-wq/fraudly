import { afterEach, describe, expect, it, vi } from "vitest";
import {
  detectRiskTrustMismatch,
  logTrustDisplayAlignment,
  payloadHasV2Schema
} from "@/lib/trust/trustDisplayLog";
import { PUBLIC_RESULT_PAYLOAD_SCHEMA_VERSION } from "@/lib/trust/canonicalTrustBridge";

describe("trustDisplayLog", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("detects risk/trust mismatch beyond tolerance", () => {
    expect(detectRiskTrustMismatch(80, 20)).toBe(false);
    expect(detectRiskTrustMismatch(80, 50)).toBe(true);
  });

  it("logs mismatch at warn in production-safe JSON", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TRUST_DISPLAY_LOG_ALWAYS", "1");

    logTrustDisplayAlignment({
      domain: "example.com",
      riskScore: 88,
      trustScore: 50,
      consumerVerdictLabel: "Use Caution",
      statusLabel: "Strong risk context snapshot",
      hasPublicPayloadV2: false,
      source: "check-page",
      mismatchStatusLabel: true,
      mismatchRiskTrust: true
    });

    expect(warn).toHaveBeenCalled();
    const line = String(warn.mock.calls[0]?.[0]);
    expect(line).toContain("trust_display_alignment");
    expect(line).toContain("mismatchStatusLabel");
    expect(line).not.toContain("userId");
  });

  it("payloadHasV2Schema detects schema version", () => {
    expect(payloadHasV2Schema({ schemaVersion: PUBLIC_RESULT_PAYLOAD_SCHEMA_VERSION })).toBe(true);
    expect(payloadHasV2Schema({ score: 1 })).toBe(false);
  });
});
