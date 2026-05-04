import type { ReviewSignals } from "@/lib/reviewSignals";

export type ScamVerdict = "safe" | "suspicious" | "scam";

export interface ScamCheckResult {
  score: number;
  verdict: ScamVerdict;
  domain: string;
  reasons: string[];
  reviewSignals: ReviewSignals;
  reviewSummary: string;
  aiUsed: boolean;
}

const VERDICTS: ScamVerdict[] = ["safe", "suspicious", "scam"];

export function isScamCheckResult(value: unknown): value is ScamCheckResult {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  if (typeof o.score !== "number" || Number.isNaN(o.score)) return false;
  if (typeof o.verdict !== "string" || !VERDICTS.includes(o.verdict as ScamVerdict)) return false;
  if (typeof o.domain !== "string") return false;
  if (typeof o.reviewSummary !== "string") return false;
  if (typeof o.aiUsed !== "boolean") return false;
  if (!Array.isArray(o.reasons)) return false;
  if (!o.reasons.every((r) => typeof r === "string")) return false;
  if (!o.reviewSignals || typeof o.reviewSignals !== "object") return false;

  const review = o.reviewSignals as Record<string, unknown>;
  if (typeof review.trustpilotFound !== "boolean") return false;
  if (!Array.isArray(review.suspiciousReviewSignals)) return false;
  if (!review.suspiciousReviewSignals.every((r) => typeof r === "string")) return false;
  if (review.trustpilotScore !== undefined && typeof review.trustpilotScore !== "number") return false;
  if (review.reviewCount !== undefined && typeof review.reviewCount !== "number") return false;
  if (review.recentReviewSummary !== undefined) {
    if (!Array.isArray(review.recentReviewSummary)) return false;
    if (!review.recentReviewSummary.every((r) => typeof r === "string")) return false;
  }

  return true;
}
