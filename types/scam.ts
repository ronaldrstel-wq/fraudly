import type { ReviewSignals } from "@/lib/reviewSignals";
import type { ScoreResult, ScoreSignal } from "@/lib/scoringEngine";
import type { SupplyChainSignals } from "@/lib/supplyChainSignals";
import type { DomainIntelligence, SafeBrowsingCheck, SslCheck, TrustSignal } from "@/lib/checks/types";

export type { ScoreResult, ScoreSignal };

export type ScamVerdict = "safe" | "suspicious" | "scam";

export interface ScamCheckResult {
  score: number;
  verdict: ScamVerdict;
  domain: string;
  reasons: string[];
  trustSignals: TrustSignal[];
  domainIntelligence: DomainIntelligence;
  safeBrowsing: SafeBrowsingCheck;
  openPhish: { listed: boolean; matches: string[]; source: string; warnings: string[] };
  urlHaus: { listed: boolean; matches: string[]; source: string; warnings: string[] };
  ssl: SslCheck;
  police: {
    listedInPoliceScamDatabase: boolean;
    policeScamMatch?: string;
    policeWarningReason?: string;
    source: string;
    warnings: string[];
  };
  reviewSignals: ReviewSignals;
  reviewSummary: string;
  aiUsed: boolean;
  supplyChainSignals: SupplyChainSignals;
  scoreResult: ScoreResult;
}

export interface BasicCheckResult {
  score: number;
  verdict: ScamVerdict;
  domain: string;
}

export interface BillingSnapshot {
  plan: "free" | "premium";
  freeChecksUsed: number;
  credits: number;
  monthlyChecksUsed: number;
  paidChecksCount: number;
  subscriptionStatus: "active" | "inactive" | "canceled" | "past_due";
}

export interface CheckApiResponse {
  result: ScamCheckResult | BasicCheckResult;
  detailLevel: "basic" | "full";
  upsellPremium: boolean;
  billing: BillingSnapshot;
}

const VERDICTS: ScamVerdict[] = ["safe", "suspicious", "scam"];

const SCORE_CATEGORIES: ScoreSignal["category"][] = [
  "domain",
  "reviews",
  "supply_chain",
  "business_identity",
  "website_quality",
  "ai"
];

function isTrustSignal(value: unknown): value is TrustSignal {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  if (s.type !== "positive" && s.type !== "warning" && s.type !== "danger") return false;
  if (typeof s.title !== "string") return false;
  if (typeof s.description !== "string") return false;
  if (s.source !== undefined && typeof s.source !== "string") return false;
  return true;
}

function isScoreSignal(value: unknown): value is ScoreSignal {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  if (typeof s.id !== "string") return false;
  if (typeof s.label !== "string") return false;
  if (typeof s.category !== "string" || !SCORE_CATEGORIES.includes(s.category as ScoreSignal["category"])) return false;
  if (typeof s.impact !== "number" || Number.isNaN(s.impact)) return false;
  if (s.confidence !== "low" && s.confidence !== "medium" && s.confidence !== "high") return false;
  if (typeof s.reason !== "string") return false;
  return true;
}

function isScoreResult(value: unknown): value is ScoreResult {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  if (typeof r.baseScore !== "number" || Number.isNaN(r.baseScore)) return false;
  if (typeof r.finalScore !== "number" || Number.isNaN(r.finalScore)) return false;
  if (typeof r.verdict !== "string" || !VERDICTS.includes(r.verdict as ScamVerdict)) return false;
  if (!Array.isArray(r.signals) || !r.signals.every(isScoreSignal)) return false;
  if (!Array.isArray(r.topPositiveSignals) || !r.topPositiveSignals.every(isScoreSignal)) return false;
  if (!Array.isArray(r.topNegativeSignals) || !r.topNegativeSignals.every(isScoreSignal)) return false;
  return true;
}

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
  if (!Array.isArray(o.trustSignals) || !o.trustSignals.every(isTrustSignal)) return false;
  if (!o.reviewSignals || typeof o.reviewSignals !== "object") return false;
  if (!o.domainIntelligence || typeof o.domainIntelligence !== "object") return false;
  if (!o.safeBrowsing || typeof o.safeBrowsing !== "object") return false;
  if (!o.openPhish || typeof o.openPhish !== "object") return false;
  if (!o.urlHaus || typeof o.urlHaus !== "object") return false;
  if (!o.ssl || typeof o.ssl !== "object") return false;
  if (!o.police || typeof o.police !== "object") return false;

  const review = o.reviewSignals as Record<string, unknown>;
  if (typeof review.googleFound !== "boolean") return false;
  if (typeof review.trustpilotFound !== "boolean") return false;
  if (!Array.isArray(review.suspiciousReviewSignals)) return false;
  if (!review.suspiciousReviewSignals.every((r) => typeof r === "string")) return false;
  if (review.googleRating !== undefined && typeof review.googleRating !== "number") return false;
  if (review.googleReviewCount !== undefined && typeof review.googleReviewCount !== "number") return false;
  if (review.trustpilotRating !== undefined && typeof review.trustpilotRating !== "number") return false;
  if (review.trustpilotReviewCount !== undefined && typeof review.trustpilotReviewCount !== "number") return false;
  if (review.recentReviewSummary !== undefined) {
    if (!Array.isArray(review.recentReviewSummary)) return false;
    if (!review.recentReviewSummary.every((r) => typeof r === "string")) return false;
  }
  if (!Array.isArray(review.sources)) return false;
  if (!review.sources.every((s) => typeof s === "string")) return false;
  if (!Array.isArray(review.warnings)) return false;
  if (!review.warnings.every((w) => typeof w === "string")) return false;

  if (!o.supplyChainSignals || typeof o.supplyChainSignals !== "object") return false;
  const sc = o.supplyChainSignals as Record<string, unknown>;
  if (typeof sc.likelyDropshipping !== "boolean") return false;
  if (typeof sc.likelyChinaShipping !== "boolean") return false;
  if (typeof sc.likelyLocalProduction !== "boolean") return false;
  if (sc.confidence !== "low" && sc.confidence !== "medium" && sc.confidence !== "high") return false;
  if (typeof sc.scoreAdjustment !== "number" || Number.isNaN(sc.scoreAdjustment)) return false;
  if (!Array.isArray(sc.reasons)) return false;
  if (!sc.reasons.every((r) => typeof r === "string")) return false;
  if (sc.dropshipConfidence !== "low" && sc.dropshipConfidence !== "medium" && sc.dropshipConfidence !== "high") {
    return false;
  }
  if (sc.chinaConfidence !== "low" && sc.chinaConfidence !== "medium" && sc.chinaConfidence !== "high") {
    return false;
  }
  if (sc.localConfidence !== "low" && sc.localConfidence !== "medium" && sc.localConfidence !== "high") {
    return false;
  }

  if (!o.scoreResult || !isScoreResult(o.scoreResult)) return false;

  return true;
}

export function isBasicCheckResult(value: unknown): value is BasicCheckResult {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  if (typeof o.score !== "number" || Number.isNaN(o.score)) return false;
  if (typeof o.verdict !== "string" || !VERDICTS.includes(o.verdict as ScamVerdict)) return false;
  if (typeof o.domain !== "string") return false;
  return true;
}

export function isCheckApiResponse(value: unknown): value is CheckApiResponse {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  if (o.detailLevel !== "basic" && o.detailLevel !== "full") return false;
  if (typeof o.upsellPremium !== "boolean") return false;
  if (!o.billing || typeof o.billing !== "object") return false;
  const billing = o.billing as Record<string, unknown>;
  if (billing.plan !== "free" && billing.plan !== "premium") return false;
  if (typeof billing.freeChecksUsed !== "number") return false;
  if (typeof billing.credits !== "number") return false;
  if (typeof billing.monthlyChecksUsed !== "number") return false;
  if (typeof billing.paidChecksCount !== "number") return false;
  if (
    billing.subscriptionStatus !== "active" &&
    billing.subscriptionStatus !== "inactive" &&
    billing.subscriptionStatus !== "canceled" &&
    billing.subscriptionStatus !== "past_due"
  ) {
    return false;
  }
  if (!o.result || typeof o.result !== "object") return false;
  return o.detailLevel === "full" ? isScamCheckResult(o.result) : isBasicCheckResult(o.result);
}
