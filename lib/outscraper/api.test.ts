import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchOutscraperReviewSignals } from "@/lib/outscraper/api";

describe("fetchOutscraperReviewSignals", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.OUTSCRAPER_API_KEY;
  });

  it("parses aggregate google and trustpilot ratings from Outscraper responses", async () => {
    process.env.OUTSCRAPER_API_KEY = "test-key";
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("google-maps-reviews")) {
        return new Response(
          JSON.stringify([
            [
              {
                rating: 4.6,
                reviews: 1280
              }
            ]
          ]),
          { status: 200 }
        );
      }
      if (url.includes("trustpilot/reviews")) {
        return new Response(
          JSON.stringify([
            [
              {
                review_rating: 4.2,
                total_reviews: 540,
                name: "Example",
                website: "https://example.com"
              }
            ]
          ]),
          { status: 200 }
        );
      }
      return new Response("{}", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchOutscraperReviewSignals({
      domain: "example.com",
      registrableDomain: "example.com"
    });

    expect(result.googleRating).toBe(4.6);
    expect(result.googleReviewCount).toBe(1280);
    expect(result.trustpilotRating).toBe(4.2);
    expect(result.trustpilotReviewCount).toBe(540);
    expect(result.trustpilotLookup.confidence).toBe("high");
    expect(result.ok).toBe(true);
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes("trustpilot"))).toBe(true);
  });

  it("tries company-name fallback when domain trustpilot lookup returns empty", async () => {
    process.env.OUTSCRAPER_API_KEY = "test-key";
    let trustpilotCalls = 0;
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("google-maps-reviews")) {
        return new Response(JSON.stringify([[{ rating: 4.5, reviews: 200 }]]), { status: 200 });
      }
      if (url.includes("trustpilot/reviews")) {
        trustpilotCalls += 1;
        const query = decodeURIComponent(url);
        if (query.includes("query=letsfoil.nl")) {
          return new Response(JSON.stringify([[]]), { status: 200 });
        }
        if (query.includes("query=Coolblue")) {
          return new Response(
            JSON.stringify([
              [
                {
                  review_rating: 4.4,
                  total_reviews: 12000,
                  name: "Coolblue",
                  website: "https://www.coolblue.nl"
                }
              ]
            ]),
            { status: 200 }
          );
        }
        return new Response(JSON.stringify([[]]), { status: 200 });
      }
      return new Response("{}", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchOutscraperReviewSignals({
      domain: "coolblue.nl",
      registrableDomain: "coolblue.nl",
      companyIdentity: {
        primaryName: "Coolblue",
        candidates: ["Coolblue"],
        evidence: { domainLabel: "Coolblue" }
      },
      maxTrustpilotAttempts: 4
    });

    expect(trustpilotCalls).toBeGreaterThan(1);
    expect(result.trustpilotRating).toBe(4.4);
    expect(result.trustpilotLookup.lookupMode).toBe("company-name");
    expect(result.trustpilotLookup.confidence).toBe("high");
  });
});
