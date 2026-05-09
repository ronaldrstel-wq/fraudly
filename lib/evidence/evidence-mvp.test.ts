import { describe, expect, it } from "vitest";
import type { DomainIntelligence } from "@/lib/checks/types";
import { combineEvidenceDeltas, composeTrustEvidenceBundle } from "@/lib/evidence/composeTrustEvidence";
import { EVIDENCE_IMAGE_MAX_BYTES, validateEvidenceImageBuffer } from "@/lib/evidence/imageValidation";

const baseIntel: DomainIntelligence = {
  source: "test",
  warnings: [],
  ageDays: 12
};

describe("combineEvidenceDeltas", () => {
  it("caps total positive uplift", () => {
    expect(combineEvidenceDeltas(25, 20, 15)).toBe(35);
  });

  it("allows mild negative total", () => {
    expect(combineEvidenceDeltas(-10, 0, 0)).toBe(-10);
  });
});

describe("validateEvidenceImageBuffer", () => {
  it("rejects oversized buffer", () => {
    const buf = Buffer.alloc(EVIDENCE_IMAGE_MAX_BYTES + 1, 0xff);
    const r = validateEvidenceImageBuffer(buf);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("file_too_large");
  });

  it("rejects unsupported magic", () => {
    const buf = Buffer.from("not an image");
    const r = validateEvidenceImageBuffer(buf);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("unsupported_type");
  });

  it("accepts minimal jpeg", () => {
    const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]);
    const r = validateEvidenceImageBuffer(buf);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.mime).toBe("image/jpeg");
  });
});

describe("composeTrustEvidenceBundle", () => {
  it("returns null without meaningful client evidence", () => {
    expect(
      composeTrustEvidenceBundle({
        canonicalUrl: "https://a.com",
        normalizedDomain: "a.com",
        websiteText: "hello",
        domainIntelligence: baseIntel,
        evidence: {}
      })
    ).toBeNull();
  });

  it("builds bundle when ad text present", () => {
    const b = composeTrustEvidenceBundle({
      canonicalUrl: "https://shop.example",
      normalizedDomain: "shop.example",
      websiteText: "sale today",
      domainIntelligence: baseIntel,
      evidence: { adText: "90% off nike shoes today only", sourcePlatform: "instagram" }
    });
    expect(b).not.toBeNull();
    expect(b!.appliedRiskDelta).toBeGreaterThanOrEqual(-10);
    expect(b!.appliedRiskDelta).toBeLessThanOrEqual(35);
    expect(b!.webshop).toBeDefined();
  });
});
