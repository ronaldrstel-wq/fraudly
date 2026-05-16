import type { ReviewMatchConfidence } from "@/lib/reputation/reviewMatchConfidence";
import type { ScamFeedThreatStatus } from "@/lib/signals/feedConsumerSignals";

export type ConsumerVerdictLabel = "Likely Safe" | "Use Caution" | "High Scam Risk";

export type NormalizedReviewChannel = {
  rating: number | null;
  reviewCount: number | null;
  profileUrl?: string | null;
  matchedName?: string | null;
  confidence: ReviewMatchConfidence;
  display: string | null;
};

export type NormalizedTrustResult = {
  domain: string;
  submittedUrl: string | null;
  checkedAt: string | null;
  scanId: string | null;
  /** Where display score/verdict were taken from. */
  scoreSource: "live_analysis" | "public_snapshot" | "aligned_display";

  riskScore: number | null;
  trustScore: number | null;
  verdict: ConsumerVerdictLabel;

  domainAge: {
    ageDays: number | null;
    registrationDate: string | null;
    display: string;
    source: string | null;
    verified: boolean;
  };

  ssl: {
    valid: boolean | null;
    display: string;
    source: string | null;
  };

  feeds: {
    status: ScamFeedThreatStatus;
    matchedSources: string[];
    display: string | null;
  };

  reputation: {
    trustpilot: NormalizedReviewChannel;
    google: NormalizedReviewChannel;
    /** Neutral line for reputation section when neither channel is displayable. */
    neutralFallback: string;
    /** Optional detail-only note (never a hero warning). */
    optionalUnavailableNote: string | null;
  };

  summary: string;
  helpfulSignals: string[];
  cautionSignals: string[];
  showLimitedPublicStrip: boolean;

  /** Raw scan retained for expandable technical sections only. */
  raw: import("@/types/scam").ScamCheckResult;
};

export type TrustDisplayLock = {
  riskScore: number;
  trustScore: number;
  verdict: ConsumerVerdictLabel;
  scanId?: string | null;
  source: "public_snapshot" | "aligned_display";
};
