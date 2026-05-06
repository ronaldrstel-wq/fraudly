import type { IntelScoreBreakdownEntry } from "@/lib/checks/scoring";
import type { ProviderEvidenceResult } from "@/lib/checks/providers/types";
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
  /** Modular intel providers (normalized). */
  providerEvidence: ProviderEvidenceResult[];
  /** Explainable weighted contributions derived from Tier‑1 structured checks. */
  intelScoreBreakdown: IntelScoreBreakdownEntry[];
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

export interface ScanProgressState {
  percentage: number;
  currentStage: string;
  completedStages: string[];
  activeStages: string[];
  findings: string[];
  confidence: "low" | "medium" | "high";
  assessmentLabel?: "Initial assessment" | "Refining reputation analysis" | "Final confidence calculated";
  provisionalRiskScore?: number;
}

const VERDICTS: ScamVerdict[] = ["safe", "suspicious", "scam"];

const SCORE_CATEGORIES: ScoreSignal["category"][] = [
  "domain",
  "reviews",
  "supply_chain",
  "business_identity",
  "website_quality",
  "rebrand_network",
  "company_identity",
  "product_marketplace",
  "ai"
];

function isTrustSignal(value: unknown): value is TrustSignal {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  if (s.type !== "positive" && s.type !== "info" && s.type !== "warning" && s.type !== "danger") return false;
  if (typeof s.title !== "string") return false;
  if (typeof s.description !== "string") return false;
  if (s.source !== undefined && typeof s.source !== "string") return false;
  if (s.confidence !== undefined && s.confidence !== "low" && s.confidence !== "medium" && s.confidence !== "high") {
    return false;
  }
  return true;
}

const PROVIDER_CATEGORIES: ProviderEvidenceResult["category"][] = [
  "government",
  "phishing",
  "malware",
  "domain",
  "ssl",
  "reputation"
];

function isProviderEvidenceResult(value: unknown): value is ProviderEvidenceResult {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  if (typeof p.source !== "string") return false;
  if (!PROVIDER_CATEGORIES.includes(p.category as ProviderEvidenceResult["category"])) return false;
  if (p.severity !== "positive" && p.severity !== "info" && p.severity !== "warning" && p.severity !== "danger") {
    return false;
  }
  if (typeof p.matched !== "boolean") return false;
  if (typeof p.title !== "string") return false;
  if (typeof p.description !== "string") return false;
  if (p.confidence !== "low" && p.confidence !== "medium" && p.confidence !== "high") return false;
  return true;
}

function isIntelScoreBreakdownEntry(value: unknown): value is IntelScoreBreakdownEntry {
  if (!value || typeof value !== "object") return false;
  const e = value as Record<string, unknown>;
  if (typeof e.id !== "string") return false;
  if (e.source !== undefined && typeof e.source !== "string") return false;
  if (typeof e.label !== "string") return false;
  if (typeof e.impact !== "number" || Number.isNaN(e.impact)) return false;
  if (typeof e.category !== "string" || !SCORE_CATEGORIES.includes(e.category as ScoreSignal["category"])) return false;
  if (e.confidence !== "low" && e.confidence !== "medium" && e.confidence !== "high") return false;
  if (typeof e.rationale !== "string") return false;
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
  if (s.source !== undefined && typeof s.source !== "string") return false;
  return true;
}

function isScoreResult(value: unknown): value is ScoreResult {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  if (typeof r.baseScore !== "number" || Number.isNaN(r.baseScore)) return false;
  if (typeof r.finalScore !== "number" || Number.isNaN(r.finalScore)) return false;
  if (r.confidence !== "low" && r.confidence !== "medium" && r.confidence !== "high") return false;
  if (!Array.isArray(r.riskLabels) || !r.riskLabels.every((x) => typeof x === "string")) return false;
  if (!Array.isArray(r.riskLabelDetails)) return false;
  if (
    !r.riskLabelDetails.every(
      (x) =>
        x &&
        typeof x === "object" &&
        typeof (x as Record<string, unknown>).label === "string" &&
        typeof (x as Record<string, unknown>).explanation === "string"
    )
  ) {
    return false;
  }
  if (!Array.isArray(r.signalSources) || !r.signalSources.every((x) => typeof x === "string")) return false;
  if (!Array.isArray(r.unavailableChecks) || !r.unavailableChecks.every((x) => typeof x === "string")) return false;
  if (!Array.isArray(r.relatedDomains) || !r.relatedDomains.every((x) => typeof x === "string")) return false;
  if (!r.rebrandNetworkSignals || typeof r.rebrandNetworkSignals !== "object") return false;
  const rn = r.rebrandNetworkSignals as Record<string, unknown>;
  if (rn.confidence !== "low" && rn.confidence !== "medium" && rn.confidence !== "high") return false;
  if (!Array.isArray(rn.matchedSignals) || !rn.matchedSignals.every((x) => typeof x === "string")) return false;
  if (!Array.isArray(rn.sharedContentMatches) || !rn.sharedContentMatches.every((x) => typeof x === "string")) return false;
  if (
    !Array.isArray(rn.sharedInfrastructureMatches) ||
    !rn.sharedInfrastructureMatches.every((x) => typeof x === "string")
  ) {
    return false;
  }
  if (!Array.isArray(rn.sharedIdentityMatches) || !rn.sharedIdentityMatches.every((x) => typeof x === "string")) {
    return false;
  }
  if (!r.companyIdentitySignals || typeof r.companyIdentitySignals !== "object") return false;
  const ci = r.companyIdentitySignals as Record<string, unknown>;
  if (ci.confidence !== "low" && ci.confidence !== "medium" && ci.confidence !== "high") return false;
  if (ci.companyName !== undefined && typeof ci.companyName !== "string") return false;
  if (ci.legalEntityName !== undefined && typeof ci.legalEntityName !== "string") return false;
  if (ci.claimedLocation !== undefined && typeof ci.claimedLocation !== "string") return false;
  if (ci.legalAddress !== undefined && typeof ci.legalAddress !== "string") return false;
  if (ci.returnAddress !== undefined && typeof ci.returnAddress !== "string") return false;
  if (ci.supportEmail !== undefined && typeof ci.supportEmail !== "string") return false;
  if (ci.phoneNumber !== undefined && typeof ci.phoneNumber !== "string") return false;
  if (!Array.isArray(ci.registrationNumbers) || !ci.registrationNumbers.every((x) => typeof x === "string")) return false;
  if (!Array.isArray(ci.mismatches) || !ci.mismatches.every((x) => typeof x === "string")) return false;
  if (!Array.isArray(ci.positiveSignals) || !ci.positiveSignals.every((x) => typeof x === "string")) return false;
  if (!Array.isArray(ci.riskSignals) || !ci.riskSignals.every((x) => typeof x === "string")) return false;
  if (!r.productMarketplaceSignals || typeof r.productMarketplaceSignals !== "object") return false;
  const pm = r.productMarketplaceSignals as Record<string, unknown>;
  if (pm.confidence !== "low" && pm.confidence !== "medium" && pm.confidence !== "high") return false;
  if (!Array.isArray(pm.matchedMarketplaces) || !pm.matchedMarketplaces.every((x) => typeof x === "string")) return false;
  if (typeof pm.matchedImageCount !== "number") return false;
  if (!Array.isArray(pm.matchedProducts)) return false;
  if (
    !pm.matchedProducts.every((x) => {
      if (!x || typeof x !== "object") return false;
      const m = x as Record<string, unknown>;
      if (m.imageUrl !== undefined && typeof m.imageUrl !== "string") return false;
      if (typeof m.marketplace !== "string") return false;
      if (typeof m.similarityScore !== "number") return false;
      if (m.marketplaceProductTitle !== undefined && typeof m.marketplaceProductTitle !== "string") return false;
      if (m.marketplacePrice !== undefined && typeof m.marketplacePrice !== "string") return false;
      return true;
    })
  ) {
    return false;
  }
  if (!Array.isArray(pm.riskSignals) || !pm.riskSignals.every((x) => typeof x === "string")) return false;
  if (!Array.isArray(pm.warnings) || !pm.warnings.every((x) => typeof x === "string")) return false;
  if (r.outscraperReputation !== undefined) {
    if (!r.outscraperReputation || typeof r.outscraperReputation !== "object") return false;
    const o = r.outscraperReputation as Record<string, unknown>;
    if (o.source !== "Outscraper Google Reviews") return false;
    if (typeof o.available !== "boolean") return false;
    if (o.rating !== null && o.rating !== undefined && typeof o.rating !== "number") return false;
    if (o.reviewCount !== null && o.reviewCount !== undefined && typeof o.reviewCount !== "number") return false;
    if (o.negativeReviewRatio !== null && o.negativeReviewRatio !== undefined && typeof o.negativeReviewRatio !== "number") {
      return false;
    }
    if (!Array.isArray(o.strongestComplaintThemes) || !o.strongestComplaintThemes.every((x) => typeof x === "string")) {
      return false;
    }
    if (o.confidence !== "low" && o.confidence !== "medium" && o.confidence !== "high") return false;
    if (typeof o.negativeTrend !== "boolean") return false;
    if (typeof o.suspiciousPositivePattern !== "boolean") return false;
    if (typeof o.businessIdentityMismatch !== "boolean") return false;
  }
  if (!r.scoreBreakdown || typeof r.scoreBreakdown !== "object") return false;
  const sb = r.scoreBreakdown as Record<string, unknown>;
  const keys = ["technicalSafety", "merchantTrust", "companyIdentity", "policyRisk", "reputationReviews"] as const;
  for (const key of keys) {
    const part = sb[key] as Record<string, unknown> | undefined;
    if (!part || typeof part !== "object") return false;
    if (typeof part.score !== "number") return false;
    if (typeof part.label !== "string") return false;
    if (typeof part.explanation !== "string") return false;
    if (!Array.isArray(part.positiveSignals) || !part.positiveSignals.every((x) => typeof x === "string")) return false;
    if (!Array.isArray(part.negativeSignals) || !part.negativeSignals.every((x) => typeof x === "string")) return false;
  }
  if (!Array.isArray(r.scoreCapsApplied)) return false;
  if (
    !r.scoreCapsApplied.every(
      (x) =>
        x &&
        typeof x === "object" &&
        typeof (x as Record<string, unknown>).cap === "number" &&
        typeof (x as Record<string, unknown>).reason === "string"
    )
  ) {
    return false;
  }
  if (!r.userExplanation || typeof r.userExplanation !== "object") return false;
  const ue = r.userExplanation as Record<string, unknown>;
  if (typeof ue.summary !== "string") return false;
  if (!Array.isArray(ue.mainReasons) || !ue.mainReasons.every((x) => typeof x === "string")) return false;
  if (!Array.isArray(ue.positiveNotes) || !ue.positiveNotes.every((x) => typeof x === "string")) return false;
  if (!Array.isArray(ue.cautionNotes) || !ue.cautionNotes.every((x) => typeof x === "string")) return false;
  if (typeof ue.recommendation !== "string") return false;
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
  if (!Array.isArray(o.providerEvidence) || !o.providerEvidence.every(isProviderEvidenceResult)) return false;
  if (!Array.isArray(o.intelScoreBreakdown) || !o.intelScoreBreakdown.every(isIntelScoreBreakdownEntry)) return false;
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
