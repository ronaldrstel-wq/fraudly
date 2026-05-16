import type { ScamCheckResult } from "@/types/scam";
import { assessCriticalThreat } from "@/lib/scanPresentation";
import { displayTrustScoreForResult } from "@/lib/scanPresentation";
import { normalizeDomainAge, type NormalizeDomainAgeInput } from "@/lib/domain/normalizeDomainAge";
import { DOMAIN_AGE_NOT_VERIFIED_LABEL } from "@/lib/format/domainAge";
import {
  PUBLIC_REVIEW_NOT_MATCHED_COPY,
  resolveGoogleReviewMatch,
  resolveTrustpilotReviewMatch
} from "@/lib/reputation/reviewMatchConfidence";
import { basedOnReviewsLine, formatRatingOutOfFive } from "@/lib/reputation/reviewRatingNormalize";
import {
  assessScamFeedThreatStatus,
  FEED_CLEAN_SUMMARY,
  FEED_HIT_SUMMARY,
  isConfirmedScamFeedHitSignal
} from "@/lib/signals/feedConsumerSignals";
import { normalizeConsumerSignalsForResult } from "@/lib/signals/normalizeConsumerSignals";
import { formatSslHighlightValue } from "@/lib/signals/trustHighlightFacts";
import { shortScanExplanation } from "@/lib/scanResultDualLayer";
import { normalizeRiskScore, standardVerdictLabel } from "@/lib/scoring/displayScore";
import type { ReviewSignals } from "@/lib/reviewSignals";
import type { DomainAgeIntelSource } from "@/lib/format/domainAge";
import { domainAgeConsumerBucket } from "@/lib/format/domainAge";
import type { ConsumerVerdictLabel, NormalizedReviewChannel, NormalizedTrustResult, TrustDisplayLock } from "@/lib/trust/types";
import type { LatestPublicCheckSnapshot } from "@/lib/latest-public-checks/snapshot";

const OPTIONAL_REPUTATION_UNAVAILABLE =
  "Some optional public reputation sources were unavailable during this scan.";

export type NormalizeTrustResultOptions = {
  displayLock?: TrustDisplayLock | null;
  submittedUrl?: string | null;
  checkedAt?: Date | string | null;
  route?: string;
  enrichment?: DomainAgeIntelSource | null;
};

function formatReviewDisplay(
  source: "Google Reviews" | "Trustpilot",
  rating: number | null,
  reviewCount: number | null,
  displayable: boolean
): string | null {
  if (!displayable || rating == null || reviewCount == null) return null;
  return `${source}: ${formatRatingOutOfFive(rating)} · ${basedOnReviewsLine(reviewCount)}`;
}

function resolveReviewChannel(
  source: "Google Reviews" | "Trustpilot",
  match: ReturnType<typeof resolveGoogleReviewMatch>
): NormalizedReviewChannel {
  return {
    rating: match.rating,
    reviewCount: match.reviewCount,
    profileUrl: null,
    matchedName: null,
    confidence: match.confidence,
    display: formatReviewDisplay(source, match.rating, match.reviewCount, match.displayable)
  };
}

function feedMatchedSources(result: ScamCheckResult): string[] {
  const out: string[] = [];
  if (result.openPhish.listed) out.push("OpenPhish");
  if (result.urlHaus.listed) out.push("URLhaus");
  if (result.safeBrowsing.safeBrowsingStatus === "flagged") out.push("Google Safe Browsing");
  for (const signal of result.trustSignals) {
    if (!isConfirmedScamFeedHitSignal(signal)) continue;
    const title = signal.title.trim();
    if (title && !out.includes(title)) out.push(title);
  }
  return out;
}

function feedDisplayForStatus(status: ReturnType<typeof assessScamFeedThreatStatus>): string | null {
  if (status === "hit") return FEED_HIT_SUMMARY;
  if (status === "clean") return FEED_CLEAN_SUMMARY;
  return null;
}

function ageInputFromResult(result: ScamCheckResult, enrichment?: DomainAgeIntelSource | null): NormalizeDomainAgeInput {
  return {
    domainIntelligence: result.domainIntelligence,
    providerEvidence: result.providerEvidence,
    trustSignals: result.trustSignals,
    scoreResult: result.scoreResult,
    enrichment
  };
}

/** Single consumer-facing trust model — all surfaces must use this. */
export function normalizeTrustResult(
  result: ScamCheckResult,
  options: NormalizeTrustResultOptions = {}
): NormalizedTrustResult {
  const threat = assessCriticalThreat(result);
  const liveTrust = displayTrustScoreForResult(result);
  const liveRisk = normalizeRiskScore(result.score);

  const lock = options.displayLock ?? null;
  const trustScore = lock?.trustScore ?? liveTrust;
  const riskScore = lock?.riskScore ?? (liveTrust != null ? normalizeRiskScore(100 - liveTrust) : liveRisk);
  const verdict: ConsumerVerdictLabel =
    lock?.verdict ??
    ((trustScore != null ? standardVerdictLabel(trustScore) : "Use Caution") as ConsumerVerdictLabel);
  const scoreSource = lock?.source ?? "live_analysis";

  const ageNormalized = normalizeDomainAge(ageInputFromResult(result, options.enrichment), {
    domain: result.domain,
    route: options.route ?? "normalizeTrustResult"
  });

  const sslValid =
    result.ssl && typeof result.ssl === "object"
      ? result.ssl.httpsEnabled && result.ssl.validCertificate
        ? true
        : result.ssl.httpsEnabled
          ? false
          : null
      : null;

  const feedStatus = assessScamFeedThreatStatus(result.trustSignals);
  const consumerSignals = normalizeConsumerSignalsForResult(result);

  const reviewSignals: ReviewSignals = result.reviewSignals ?? {
    googleFound: false,
    trustpilotFound: false,
    suspiciousReviewSignals: [],
    sources: [],
    warnings: [],
    publicReviewAvailabilityNotes: [],
    reviewFetchDebug: []
  };

  const google = resolveReviewChannel("Google Reviews", resolveGoogleReviewMatch(reviewSignals));
  const trustpilot = resolveReviewChannel("Trustpilot", resolveTrustpilotReviewMatch(reviewSignals));

  const isLikelySafe = verdict === "Likely Safe";

  const showLimitedPublicStrip =
    !threat.active &&
    !isLikelySafe &&
    result.confidenceLevel === "low" &&
    result.siteStatus !== "nonexistent" &&
    result.siteStatus !== "inactive" &&
    result.siteStatus !== "confirmed_malicious";

  const optionalUnavailableNote =
    result.confidenceLevel === "low" && !threat.active
      ? OPTIONAL_REPUTATION_UNAVAILABLE
      : null;

  const summary = threat.active
    ? "Confirmed threat intelligence affected this result."
    : shortScanExplanation({
        threatActive: threat.active,
        threatKind: threat.kind,
        siteStatus: result.siteStatus,
        displayTrust: trustScore ?? 0,
        confidenceLevel: result.confidenceLevel ?? "medium"
      }) ||
      result.reviewSummary ||
      "Automated trust snapshot for this domain.";

  const normalized: NormalizedTrustResult = {
    domain: result.domain,
    submittedUrl: options.submittedUrl ?? result.redirectChain?.finalUrl ?? `https://${result.domain}`,
    checkedAt:
      options.checkedAt instanceof Date
        ? options.checkedAt.toISOString()
        : options.checkedAt ?? null,
    scanId: lock?.scanId ?? null,
    scoreSource,
    riskScore,
    trustScore,
    verdict,
    domainAge: {
      ageDays: ageNormalized.ageDays,
      registrationDate: ageNormalized.registrationDate,
      display: ageNormalized.displayAge ?? DOMAIN_AGE_NOT_VERIFIED_LABEL,
      source: ageNormalized.source,
      verified: ageNormalized.ageDays != null
    },
    ssl: {
      valid: sslValid,
      display: formatSslHighlightValue(result.ssl),
      source: result.ssl?.source ?? null
    },
    feeds: {
      status: feedStatus,
      matchedSources: feedMatchedSources(result),
      display: feedDisplayForStatus(feedStatus)
    },
    reputation: {
      google,
      trustpilot,
      neutralFallback: PUBLIC_REVIEW_NOT_MATCHED_COPY,
      optionalUnavailableNote
    },
    summary,
    helpfulSignals: consumerSignals.helpful,
    cautionSignals: consumerSignals.watch,
    showLimitedPublicStrip,
    raw: result
  };

  if (process.env.NODE_ENV !== "production" && options.route) {
    console.info("[trust-normalize]", {
      domain: result.domain,
      route: options.route,
      scoreSource: normalized.scoreSource,
      trustScore: normalized.trustScore,
      riskScore: normalized.riskScore,
      verdict: normalized.verdict,
      scanId: normalized.scanId,
      domainAge: {
        display: normalized.domainAge.display,
        source: normalized.domainAge.source,
        ageDays: normalized.domainAge.ageDays
      },
      feeds: normalized.feeds.status,
      reputation: {
        google: normalized.reputation.google.confidence,
        trustpilot: normalized.reputation.trustpilot.confidence
      },
      showLimitedPublicStrip: normalized.showLimitedPublicStrip
    });
  }

  return normalized;
}

export function displayLockFromSnapshot(snapshot: LatestPublicCheckSnapshot): TrustDisplayLock {
  const trustScore = snapshot.display.trustScore;
  return {
    riskScore: snapshot.display.riskScore,
    trustScore,
    verdict: standardVerdictLabel(trustScore) as ConsumerVerdictLabel,
    scanId: snapshot.id,
    source: "public_snapshot"
  };
}

export function trustHighlightsFromNormalized(
  normalized: NormalizedTrustResult
): Array<{ label: string; value: string; bucket: "positive" | "caution" }> {
  const rows: Array<{ label: string; value: string; bucket: "positive" | "caution" }> = [];
  if (normalized.domainAge.verified) {
    rows.push({
      label: "Domain age",
      value: normalized.domainAge.display,
      bucket: domainAgeConsumerBucket(normalized.domainAge.ageDays)
    });
  }
  rows.push({
    label: "Secure connection",
    value: normalized.ssl.display,
    bucket: normalized.ssl.valid ? "positive" : "caution"
  });
  return rows;
}

export function overviewFromNormalized(normalized: NormalizedTrustResult): {
  trustScore: number;
  verdictLabel: string;
  headline: string;
} {
  return {
    trustScore: normalized.trustScore ?? 50,
    verdictLabel: normalized.verdict,
    headline: normalized.verdict
  };
}
