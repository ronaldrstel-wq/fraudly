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
                total_reviews: 540
              }
            ]
          ]),
          { status: 200 }
        );
      }
      return new Response("{}", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchOutscraperReviewSignals("example.com");

    expect(result.googleRating).toBe(4.6);
    expect(result.googleReviewCount).toBe(1280);
    expect(result.trustpilotRating).toBe(4.2);
    expect(result.trustpilotReviewCount).toBe(540);
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
