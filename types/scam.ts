import type { IntelScoreBreakdownEntry } from "@/lib/checks/scoring";
import type { ProviderEvidenceResult } from "@/lib/checks/providers/types";
import type { ReviewSignals } from "@/lib/reviewSignals";
import type { ScoreEvidenceTier, ScoreResult, ScoreSignal } from "@/lib/scoringEngine";
import type { SupplyChainSignals } from "@/lib/supplyChainSignals";
import type { DomainIntelligence, SafeBrowsingCheck, SslCheck, TrustSignal } from "@/lib/checks/types";
import type { PendingPageBehaviorSignals } from "@/types/behavioral-signals";
import type { DomainInfrastructure } from "@/types/domain-infrastructure";
import type { ConfidenceLevel, SiteStatus } from "@/types/site-outcome";
import type { TrustEvidenceBundle } from "@/lib/evidence/types";
import type { RedirectChainAnalysis } from "@/lib/checks/redirectChain";

export type { ScoreResult, ScoreSignal };

export type ScamVerdict = "safe" | "suspicious" | "scam";

export interface ScamCheckResult {
  score: number;
  verdict: ScamVerdict;
  domain: string;
  /** Raw submitted host token (before/after URL normalization). */
  submittedHostname?: string;
  /** eTLD+1 root used for RDAP/registration lookups. */
  registrableDomain?: string;
  /** Parsed subdomain portion when present. */
  subdomain?: string | null;
  isSubdomain?: boolean;
  suspiciousSubdomainTerms?: string[];
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
  /** DNS + RDAP-backed signal for hosts that likely do not exist or cannot be corroborated. */
  domainInfrastructure: DomainInfrastructure;
  /** Deterministic UX status — distinct from verdict string mapping. */
  siteStatus: SiteStatus;
  /** Evidence completeness (“how certain are we”). */
  confidenceLevel: ConfidenceLevel;
  confidenceRationale: string;
  /**
   * When explicitly `true`, hide the radial trust gauge (invalid / nonexistent apex).
   * Omit or `false` for normal graded checks and legacy snapshots.
   */
  omitTrustScoreGauge?: boolean;
  /** Reserved structure for deterministic page-behaviour phishing checks (all optional booleans today). */
  behavioralSignalsPending: PendingPageBehaviorSignals;
  /** Redirect relationship between entered URL and final destination URL. */
  redirectChain?: RedirectChainAnalysis;
  /** Optional screenshot / ad / webshop heuristics layered on top of the URL scan. */
  trustEvidence?: TrustEvidenceBundle;
  /** Optional admin quality override (auditable, separate from raw evidence). */
  adminOverride?: {
    verdict: "trusted" | "suspicious" | "high_risk";
    note?: string | null;
    appliedAt: string;
  };
  availability?: {
    status: "reachable" | "limited" | "unreachable";
    methodTried: "HEAD+GET" | "GET";
    httpStatus: number | null;
    finalUrl: string | null;
    dnsResolved: boolean;
    tlsOk: boolean;
    timedOut: boolean;
    errorCode: string | null;
    reason: string;
  };
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

const SITE_STATUSES: SiteStatus[] = [
  "trusted",
  "unverified",
  "caution",
  "high_risk",
  "confirmed_malicious",
  "nonexistent",
  "inactive"
];

const CONFIDENCE_LEVELS: ConfidenceLevel[] = ["high", "medium", "low"];

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

const EVIDENCE_TIERS: ScoreEvidenceTier[] = [
  "confirmed_malicious",
  "positive_trust",
  "neutral_observation",
  "risk_indicator",
  "missing_data"
];

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
  if (e.evidenceTier !== undefined && !EVIDENCE_TIERS.includes(e.evidenceTier as ScoreEvidenceTier)) return false;
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
  if (s.evidenceTier !== undefined && !EVIDENCE_TIERS.includes(s.evidenceTier as ScoreEvidenceTier)) return false;
  return true;
}

function isTrustEvidenceBundle(value: unknown): value is TrustEvidenceBundle {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  if (typeof o.appliedRiskDelta !== "number" || Number.isNaN(o.appliedRiskDelta)) return false;
  return true;
}

function isPendingBehaviorSignals(value: unknown): value is PendingPageBehaviorSignals {
  if (!value || typeof value !== "object") return false;
  const b = value as Record<string, unknown>;
  const ok = Object.values(b).every((v) => v === undefined || typeof v === "boolean");
  return ok;
}

function isRedirectChainAnalysis(value: unknown): value is RedirectChainAnalysis {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  if (typeof r.originalUrl !== "string") return false;
  if (typeof r.originalDomain !== "string") return false;
  if (!Array.isArray(r.redirectChain) || !r.redirectChain.every((s) => typeof s === "string")) return false;
  if (typeof r.finalUrl !== "string") return false;
  if (typeof r.finalDomain !== "string") return false;
  if (typeof r.redirectCount !== "number") return false;
  if (typeof r.crossDomainRedirect !== "boolean") return false;
  if (typeof r.timedOut !== "boolean") return false;
  if (typeof r.tooManyRedirects !== "boolean") return false;
  if (r.error !== undefined && typeof r.error !== "string") return false;
  return true;
}

const REVIEW_FETCH_DEBUG_BUCKETS = [
  "provider_error",
  "source_unavailable",
  "review_signal",
  "website_behavior"
] as const;

const REVIEW_FETCH_DEBUG_SOURCES = ["trustpilot_public", "google_indexed_snippets"] as const;

function isReviewFetchDebugEntry(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  if (typeof r.source !== "string" || !REVIEW_FETCH_DEBUG_SOURCES.includes(r.source as (typeof REVIEW_FETCH_DEBUG_SOURCES)[number])) {
    return false;
  }
  if (
    typeof r.bucket !== "string" ||
    !REVIEW_FETCH_DEBUG_BUCKETS.includes(r.bucket as (typeof REVIEW_FETCH_DEBUG_BUCKETS)[number])
  ) {
    return false;
  }
  return true;
}

function isDomainInfrastructure(value: unknown): value is DomainInfrastructure {
  if (!value || typeof value !== "object") return false;
  const d = value as Record<string, unknown>;
  if (typeof d.dnsResolvable !== "boolean") return false;
  if (typeof d.rdapIndicatesNotFound !== "boolean") return false;
  if (typeof d.treatAsNonExistentHost !== "boolean") return false;
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
  if (r.trustScoreCap !== undefined && (typeof r.trustScoreCap !== "number" || Number.isNaN(r.trustScoreCap))) return false;
  if (r.trustedBlockedReason !== undefined && r.trustedBlockedReason !== "no_trust_anchor") return false;
  return true;
}

export function isScamCheckResult(value: unknown): value is ScamCheckResult {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  if (typeof o.score !== "number" || Number.isNaN(o.score)) return false;
  if (typeof o.verdict !== "string" || !VERDICTS.includes(o.verdict as ScamVerdict)) return false;
  if (typeof o.domain !== "string") return false;
  if (o.submittedHostname !== undefined && typeof o.submittedHostname !== "string") return false;
  if (o.registrableDomain !== undefined && typeof o.registrableDomain !== "string") return false;
  if (o.subdomain !== undefined && o.subdomain !== null && typeof o.subdomain !== "string") return false;
  if (o.isSubdomain !== undefined && typeof o.isSubdomain !== "boolean") return false;
  if (o.suspiciousSubdomainTerms !== undefined) {
    if (!Array.isArray(o.suspiciousSubdomainTerms)) return false;
    if (!o.suspiciousSubdomainTerms.every((s) => typeof s === "string")) return false;
  }
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
  if (review.publicReviewAvailabilityNotes !== undefined) {
    if (!Array.isArray(review.publicReviewAvailabilityNotes)) return false;
    if (!review.publicReviewAvailabilityNotes.every((n) => typeof n === "string")) return false;
  }
  if (review.reviewFetchDebug !== undefined) {
    if (!Array.isArray(review.reviewFetchDebug)) return false;
    if (!review.reviewFetchDebug.every(isReviewFetchDebugEntry)) return false;
  }

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
  if (!o.domainInfrastructure || !isDomainInfrastructure(o.domainInfrastructure)) return false;
  if (typeof o.siteStatus !== "string" || !SITE_STATUSES.includes(o.siteStatus as SiteStatus)) return false;
  if (typeof o.confidenceLevel !== "string" || !CONFIDENCE_LEVELS.includes(o.confidenceLevel as ConfidenceLevel)) {
    return false;
  }
  if (typeof o.confidenceRationale !== "string") return false;
  if (
    o.omitTrustScoreGauge !== undefined &&
    o.omitTrustScoreGauge !== null &&
    typeof o.omitTrustScoreGauge !== "boolean"
  ) {
    return false;
  }
  if (!o.behavioralSignalsPending || !isPendingBehaviorSignals(o.behavioralSignalsPending)) return false;
  if (o.redirectChain !== undefined && o.redirectChain !== null && !isRedirectChainAnalysis(o.redirectChain)) return false;

  if (o.trustEvidence !== undefined && o.trustEvidence !== null && !isTrustEvidenceBundle(o.trustEvidence)) {
    return false;
  }
  if (o.availability !== undefined && o.availability !== null) {
    if (typeof o.availability !== "object") return false;
    const a = o.availability as Record<string, unknown>;
    if (a.status !== "reachable" && a.status !== "limited" && a.status !== "unreachable") return false;
    if (a.methodTried !== "HEAD+GET" && a.methodTried !== "GET") return false;
    if (a.httpStatus !== null && a.httpStatus !== undefined && typeof a.httpStatus !== "number") return false;
    if (a.finalUrl !== null && a.finalUrl !== undefined && typeof a.finalUrl !== "string") return false;
    if (typeof a.dnsResolved !== "boolean") return false;
    if (typeof a.tlsOk !== "boolean") return false;
    if (typeof a.timedOut !== "boolean") return false;
    if (a.errorCode !== null && a.errorCode !== undefined && typeof a.errorCode !== "string") return false;
    if (typeof a.reason !== "string") return false;
  }
  if (o.adminOverride !== undefined && o.adminOverride !== null) {
    if (typeof o.adminOverride !== "object") return false;
    const ao = o.adminOverride as Record<string, unknown>;
    if (ao.verdict !== "trusted" && ao.verdict !== "suspicious" && ao.verdict !== "high_risk") return false;
    if (ao.note !== undefined && ao.note !== null && typeof ao.note !== "string") return false;
    if (typeof ao.appliedAt !== "string") return false;
  }

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
