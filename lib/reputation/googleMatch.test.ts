import { describe, expect, it } from "vitest";
import {
  googleValidationAffectsTrustScore,
  googleValidationIsDisplayable,
  validateGoogleBusinessMatch
} from "@/lib/reputation/googleMatch";

describe("validateGoogleBusinessMatch", () => {
  it("accepts exact registrable domain match with high confidence", () => {
    const result = validateGoogleBusinessMatch(
      {
        rating: 5,
        reviewCount: 42,
        businessName: "LetsFoil",
        website: "https://www.letsfoil.nl"
      },
      "letsfoil.nl",
      { primaryName: "LetsFoil", candidates: ["LetsFoil"], evidence: {} }
    );
    expect(result.confidence).toBe("high");
    expect(result.exactDomainMatch).toBe(true);
    expect(result.score).toBe(1);
    expect(googleValidationIsDisplayable(result)).toBe(true);
    expect(googleValidationAffectsTrustScore(result)).toBe(true);
  });

  it("rejects contradictory profile website (wrong entity)", () => {
    const result = validateGoogleBusinessMatch(
      {
        rating: 2,
        reviewCount: 18,
        businessName: "Unrelated Shop",
        website: "https://other-business.com"
      },
      "letsfoil.nl",
      { primaryName: "LetsFoil", candidates: ["LetsFoil"], evidence: {} }
    );
    expect(result.confidence).toBe("low");
    expect(result.exactDomainMatch).toBe(false);
    expect(result.accepted).toBe(false);
    expect(googleValidationIsDisplayable(result)).toBe(false);
    expect(googleValidationAffectsTrustScore(result)).toBe(false);
  });

  it("does not treat name-only match as score-eligible without exact domain", () => {
    const result = validateGoogleBusinessMatch(
      {
        rating: 4.8,
        reviewCount: 200,
        businessName: "LetsFoil",
        website: "https://maps.google.com"
      },
      "letsfoil.nl",
      { primaryName: "LetsFoil", candidates: ["LetsFoil"], evidence: {} }
    );
    expect(result.exactDomainMatch).toBe(false);
    expect(googleValidationIsDisplayable(result)).toBe(false);
    expect(googleValidationAffectsTrustScore(result)).toBe(false);
  });
});
