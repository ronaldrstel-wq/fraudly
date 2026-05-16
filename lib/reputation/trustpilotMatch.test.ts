import { describe, expect, it } from "vitest";
import { extractCompanyIdentity } from "@/lib/reputation/companyIdentity";
import { validateTrustpilotMatch } from "@/lib/reputation/trustpilotMatch";

describe("validateTrustpilotMatch", () => {
  const identity = extractCompanyIdentity(null, "letsfoil.nl");

  it("accepts high confidence when profile domain matches", () => {
    const result = validateTrustpilotMatch(
      {
        rating: 4.5,
        reviewCount: 120,
        companyName: "Letsfoil",
        website: "https://www.letsfoil.nl",
        profileUrl: "https://www.trustpilot.com/review/letsfoil.nl"
      },
      "letsfoil.nl",
      identity
    );
    expect(result.accepted).toBe(true);
    expect(result.confidence).toBe("high");
  });

  it("rejects low confidence when profile domain contradicts scanned domain", () => {
    const result = validateTrustpilotMatch(
      {
        rating: 4.8,
        reviewCount: 900,
        companyName: "Letsfoil Impostor",
        website: "https://other-shop.example",
        profileUrl: "https://www.trustpilot.com/review/other-shop.example"
      },
      "letsfoil.nl",
      identity
    );
    expect(result.accepted).toBe(false);
    expect(result.confidence).toBe("low");
  });

  it("accepts medium confidence on strong company-name match without contradictory domain", () => {
    const named = extractCompanyIdentity(
      `<html><head><meta property="og:site_name" content="Coolblue" /></head></html>`,
      "coolblue.nl"
    );
    const result = validateTrustpilotMatch(
      {
        rating: 4.2,
        reviewCount: 5000,
        companyName: "Coolblue",
        website: null,
        profileUrl: "https://www.trustpilot.com/review/coolblue"
      },
      "coolblue.nl",
      named
    );
    expect(result.accepted).toBe(true);
    expect(result.confidence).toBe("medium");
  });
});
