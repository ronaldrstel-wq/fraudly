import { describe, expect, it } from "vitest";
import { buildBrandQueryCandidates } from "@/lib/public-intel/brandCandidates";

describe("buildBrandQueryCandidates", () => {
  it("includes normalized domain and second-level label", () => {
    const candidates = buildBrandQueryCandidates("www.apple.com");
    expect(candidates).toContain("apple.com");
    expect(candidates).toContain("apple");
  });

  it("includes documented override candidates for short brand domains", () => {
    const candidates = buildBrandQueryCandidates("nn.nl");
    expect(candidates).toContain("Nationale-Nederlanden");
    expect(candidates).toContain("Nationale Nederlanden");
  });
});
