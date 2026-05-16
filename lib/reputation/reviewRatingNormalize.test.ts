import { describe, expect, it, vi } from "vitest";
import {
  basedOnReviewsLine,
  clampReviewRating,
  formatRatingOutOfFive,
  sanitizeReviewFields,
  starGlyphsForRating
} from "@/lib/reputation/reviewRatingNormalize";

describe("reviewRatingNormalize", () => {
  it("maps rating 4 and count 8 to correct display strings", () => {
    const { rating, reviewCount } = sanitizeReviewFields(4, 8);
    expect(rating).toBe(4);
    expect(reviewCount).toBe(8);
    expect(starGlyphsForRating(rating!)).toBe("★★★★☆");
    expect(formatRatingOutOfFive(rating!)).toBe("4.0 / 5");
    expect(basedOnReviewsLine(reviewCount)).toBe("Based on 8 reviews");
  });

  it("maps rating 4.5 and count 124", () => {
    const { rating, reviewCount } = sanitizeReviewFields(4.5, 124);
    expect(rating).toBe(4.5);
    expect(reviewCount).toBe(124);
    expect(formatRatingOutOfFive(rating!)).toBe("4.5 / 5");
    expect(basedOnReviewsLine(reviewCount)).toBe("Based on 124 reviews");
  });

  it("clamps rating 8 with count 5 and logs in development", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "development");
    const { rating, reviewCount, fieldsWereSwapped } = sanitizeReviewFields(8, 5);
    expect(fieldsWereSwapped).toBe(true);
    expect(rating).toBe(5);
    expect(reviewCount).toBe(8);
    expect(warn).toHaveBeenCalled();
    vi.unstubAllEnvs();
    warn.mockRestore();
  });

  it("clamps impossible rating when count missing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "development");
    const { rating, reviewCount } = sanitizeReviewFields(8, null);
    expect(rating).toBeNull();
    expect(reviewCount).toBe(8);
    expect(warn).toHaveBeenCalled();
    vi.unstubAllEnvs();
    warn.mockRestore();
  });

  it("handles null rating with count 8", () => {
    const { rating, reviewCount } = sanitizeReviewFields(null, 8);
    expect(rating).toBeNull();
    expect(reviewCount).toBe(8);
    expect(basedOnReviewsLine(reviewCount)).toBe("Based on 8 reviews");
  });

  it("handles rating 0 and count 0", () => {
    const { rating, reviewCount } = sanitizeReviewFields(0, 0);
    expect(rating).toBe(0);
    expect(reviewCount).toBe(0);
    expect(basedOnReviewsLine(reviewCount)).toBe("Based on 0 reviews");
  });

  it("clamps display ratings above 5", () => {
    expect(clampReviewRating(4)).toBe(4);
    expect(clampReviewRating(8)).toBe(5);
  });
});
