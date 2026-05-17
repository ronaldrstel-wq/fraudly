import { describe, expect, it } from "vitest";
import { REVIEW_SCORE_IMPACT } from "@/lib/reputation/reviewChannelPresentation";
import {
  resolveGoogleReviewChannel,
  resolveTrustpilotReviewChannel
} from "@/lib/reputation/reviewChannelPresentation";
import { reviewRatingsForScoringFromSignals } from "@/lib/reputation/reviewMatchConfidence";
import type { ReviewSignals } from "@/lib/reviewSignals";

const base: ReviewSignals = {
  googleFound: false,
  trustpilotFound: false,
  suspiciousReviewSignals: [],
  sources: [],
  warnings: [],
  publicReviewAvailabilityNotes: [],
  reviewFetchDebug: []
};

describe("reviewChannelPresentation", () => {
  it("shows strong Google reviews with score impact when gates pass", () => {
    const channel = resolveGoogleReviewChannel({
      ...base,
      googleRating: 4.6,
      googleReviewCount: 120,
      googleMatchConfidence: "high",
      googleExactDomainMatch: true,
      googleMatchScore: 1
    });
    expect(channel.displayState).toBe("strong");
    expect(channel.showMetrics).toBe(true);
    expect(channel.reputationLabel).toBe("Positive");
    expect(channel.usedInTrustScore).toBe(true);
    expect(channel.scoreImpactLabel).toBe(REVIEW_SCORE_IMPACT.usedInTrustScore);
  });

  it("shows limited state when review count is below threshold", () => {
    const channel = resolveGoogleReviewChannel({
      ...base,
      googleRating: 4.8,
      googleReviewCount: 2,
      googleMatchConfidence: "high",
      googleExactDomainMatch: true
    });
    expect(channel.displayState).toBe("limited");
    expect(channel.showMetrics).toBe(false);
    expect(channel.usedInTrustScore).toBe(false);
  });

  it("shows none when no Google data", () => {
    const channel = resolveGoogleReviewChannel(base);
    expect(channel.displayState).toBe("none");
    expect(channel.scoreImpactLabel).toBe(REVIEW_SCORE_IMPACT.noPublicReviews);
  });

  it("shows low-confidence Trustpilot without metrics", () => {
    const channel = resolveTrustpilotReviewChannel({
      ...base,
      trustpilotMatchConfidence: "medium",
      trustpilotRating: 4.2,
      trustpilotReviewCount: 40
    });
    expect(channel.displayState).toBe("low_confidence");
    expect(channel.showMetrics).toBe(false);
    expect(channel.usedInTrustScore).toBe(false);
  });

  it("does not score 1–2 reviews strongly", () => {
    const ratings = reviewRatingsForScoringFromSignals({
      ...base,
      googleRating: 5,
      googleReviewCount: 2,
      googleMatchConfidence: "high",
      googleExactDomainMatch: true
    });
    expect(ratings).toHaveLength(0);
  });

  it("never shows poor reputation for unverified Google entity match", () => {
    const channel = resolveGoogleReviewChannel({
      ...base,
      googleRating: 2,
      googleReviewCount: 40,
      googleMatchConfidence: "low",
      googleExactDomainMatch: false,
      googleMatchNote: "Possible Google business match found"
    });
    expect(channel.displayState).toBe("low_confidence");
    expect(channel.showMetrics).toBe(false);
    expect(channel.reputationLabel).toBeNull();
    expect(channel.usedInTrustScore).toBe(false);
  });

  it("includes Trustpilot in scoring only when high confidence and enough reviews", () => {
    const ratings = reviewRatingsForScoringFromSignals({
      ...base,
      trustpilotMatchConfidence: "high",
      trustpilotRating: 4.5,
      trustpilotReviewCount: 80
    });
    expect(ratings).toHaveLength(1);
    expect(ratings[0]?.count).toBe(80);
  });
});
