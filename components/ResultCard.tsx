"use client";

import { useEffect, useMemo, useState } from "react";
import { ReviewSummary } from "@/components/ReviewSummary";
import { inferIntelEvidenceTier, type IntelScoreBreakdownEntry } from "@/lib/checks/scoring";
import type { TrustSignal } from "@/lib/checks/types";
import { inferScoreEvidenceTier, type ScoreEvidenceTier, type ScoreSignal } from "@/lib/scoringEngine";
import {
  neutralLabelForReviewDebugEntry,
  reviewWarningsSafeForUi,
  sanitizePublicIntelWarningsForUi
} from "@/lib/reviewSourceNormalization";
import { assessCriticalThreat, criticalThreatBannerTitle, displayTrustScoreForResult } from "@/lib/scanPresentation";
import {
  humanRecGlyph,
  humanRecHeadline,
  humanRecHeadlineTone,
  resolveHumanRecKind,
  shortScanExplanation,
  technicalStatusText
} from "@/lib/scanResultDualLayer";
import { shouldShowLimitedPublicStrip } from "@/lib/scanResultNarrative";
import { ThreatBanner } from "@/components/ThreatBanner";
import { ResultSupportBox } from "@/components/ResultSupportBox";
import { EN_MESSAGES } from "@/lib/messages.en";
import { shouldShowTrustGauge } from "@/lib/trustGaugeDisplay";
import { trustLevelFromScore, type TrustLevel } from "@/lib/trustSystem";
import { EvidenceSignalsCard } from "@/components/EvidenceSignalsCard";
import type { HumanRecKind } from "@/lib/scanResultDualLayer";
import type { ScamCheckResult } from "@/types/scam";
import type { ConfidenceLevel, SiteStatus } from "@/types/site-outcome";
import type { ReputationEnrichment } from "@/lib/outscraper/reputation";

/** When set, consumer score/headline match `/latest-checks` snapshot for this domain. */
export type ResultCardAlignedDisplay = {
  trustScore: number;
  label: string;
  humanKind: HumanRecKind;
  humanHeadline: string;
  scanId: string;
  lastSeenAtIso: string;
};

interface ResultCardProps {
  result: ScamCheckResult;
  alignedDisplay?: ResultCardAlignedDisplay;
}

function toneForTrustSignal(signal: Pick<TrustSignal, "type">): string {
  switch (signal.type) {
    case "positive":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "info":
      return "border-slate-200 bg-slate-50 text-slate-800";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "danger":
      return "border-rose-200 bg-rose-50 text-rose-900";
  }
}

function SignalList({ signals, empty }: { signals: TrustSignal[]; empty: string }) {
  if (signals.length === 0) return <p className="mt-2 text-sm text-slate-600">{empty}</p>;
  return (
    <ul className="mt-3 space-y-2">
      {signals.map((signal, index) => (
        <li key={`${index}-${signal.title}`} className={`rounded-lg border px-3 py-2 text-sm ${toneForTrustSignal(signal)}`}>
          <p className="font-semibold">{signal.title}</p>
          <p className="mt-0.5">{signal.description}</p>
          <div className="mt-1 flex flex-wrap gap-x-2 text-xs opacity-80">
            {signal.source ? <span>Source: {signal.source}</span> : null}
            {signal.confidence ? (
              <span>
                {EN_MESSAGES.scanResult.signalReliability}: {signal.confidence}
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

const TIER_ORDER: ScoreEvidenceTier[] = [
  "confirmed_malicious",
  "positive_trust",
  "neutral_observation",
  "risk_indicator",
  "missing_data"
];

function labelForEvidenceTier(tier: ScoreEvidenceTier): string {
  return EN_MESSAGES.scanResult.evidenceTierLabels[tier];
}

function consumerSummaryFor(trustLevel: TrustLevel, threatActive: boolean): string {
  if (threatActive) return EN_MESSAGES.scanResult.consumerSummary.underThreat;
  if (trustLevel === "trusted" || trustLevel === "mostlySafe") return EN_MESSAGES.scanResult.consumerSummary.positive;
  if (trustLevel === "caution") return EN_MESSAGES.scanResult.consumerSummary.mixed;
  return EN_MESSAGES.scanResult.consumerSummary.elevated;
}

function trustMeterTone(score: number, threatActive: boolean): {
  track: string;
  fill: string;
  marker: string;
} {
  if (threatActive) {
    return {
      track: "bg-rose-100",
      fill: "bg-gradient-to-r from-rose-500 via-rose-500 to-rose-600",
      marker: "text-rose-900"
    };
  }
  if (score >= 80) {
    return {
      track: "bg-emerald-100",
      fill: "bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-500",
      marker: "text-emerald-900"
    };
  }
  if (score >= 65) {
    return {
      track: "bg-teal-100",
      fill: "bg-gradient-to-r from-teal-400 via-teal-500 to-emerald-500",
      marker: "text-teal-900"
    };
  }
  if (score >= 50) {
    return {
      track: "bg-amber-100",
      fill: "bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500",
      marker: "text-amber-900"
    };
  }
  if (score >= 30) {
    return {
      track: "bg-orange-100",
      fill: "bg-gradient-to-r from-orange-500 via-orange-500 to-rose-500",
      marker: "text-orange-950"
    };
  }
  return {
    track: "bg-rose-100",
    fill: "bg-gradient-to-r from-rose-500 via-rose-500 to-rose-600",
    marker: "text-rose-900"
  };
}

function tierScoreSignals(rows: ScoreSignal[]): Record<ScoreEvidenceTier, ScoreSignal[]> {
  const base: Record<ScoreEvidenceTier, ScoreSignal[]> = {
    confirmed_malicious: [],
    positive_trust: [],
    neutral_observation: [],
    risk_indicator: [],
    missing_data: []
  };
  for (const row of rows) {
    base[inferScoreEvidenceTier(row)].push(row);
  }
  return base;
}

function tierIntel(rows: IntelScoreBreakdownEntry[]): Record<ScoreEvidenceTier, IntelScoreBreakdownEntry[]> {
  const base: Record<ScoreEvidenceTier, IntelScoreBreakdownEntry[]> = {
    confirmed_malicious: [],
    positive_trust: [],
    neutral_observation: [],
    risk_indicator: [],
    missing_data: []
  };
  for (const row of rows) {
    base[inferIntelEvidenceTier(row)].push(row);
  }
  return base;
}

function labelForScanCoverage(level: ConfidenceLevel): string {
  switch (level) {
    case "high":
      return EN_MESSAGES.siteOutcome.scanCoverageHighLabel;
    case "medium":
      return EN_MESSAGES.siteOutcome.scanCoverageMediumLabel;
    case "low":
      return EN_MESSAGES.siteOutcome.scanCoverageLowLabel;
  }
}

function toSafeHttpUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  try {
    const url = new URL(input);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function formatReviewCount(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US").format(Math.max(0, Math.round(value)));
}

function providerStateLabel(reputation: ReputationEnrichment | null, repError: string | null): string {
  if (repError) return "Provider failed";
  switch (reputation?.reputationStatus) {
    case "not_run":
      return "Review enrichment was not run for this scan.";
    case "disabled":
      return "Review enrichment is not enabled.";
    case "cache_hit":
      return "Review data loaded from cache.";
    case "called_found":
      return "Review data found";
    case "called_no_match":
      return "No matching public review profile found.";
    case "provider_error":
      return "Review provider was unavailable during this scan.";
    default:
      return "Review enrichment was not run for this scan.";
  }
}

function publicReviewUnavailableMessage(
  reputation: ReputationEnrichment | null,
  repError: string | null,
  fallback: string
): string {
  if (repError) return fallback;
  const status = reputation?.reputationStatus;
  if (
    status === "disabled" ||
    status === "not_run" ||
    status === "provider_error" ||
    status === "called_no_match" ||
    status === "cache_hit"
  ) {
    return fallback;
  }
  return reputation?.providerReason?.trim() ? reputation.providerReason : fallback;
}

/** Tier‑1 phishing/malware list matches surfaced as structured provider rows (not guesses). */
function isConfirmedIntelTrustSignal(signal: TrustSignal): boolean {
  if (signal.type !== "danger" && signal.type !== "warning") return false;
  const blob = `${signal.title}\n${signal.description}\n${signal.source ?? ""}`.toLowerCase();
  return /safe browsing|openphish|urlhaus|politie|\bpolice\b/.test(blob);
}

export function ResultCard({ result, alignedDisplay }: ResultCardProps) {
  const threat = assessCriticalThreat(result);
  const liveDisplayTrust = displayTrustScoreForResult(result);
  const displayTrust = alignedDisplay?.trustScore ?? liveDisplayTrust;
  const hasUnavailableSite = result.availability?.status === "unavailable" || result.siteStatus === "inactive";
  const hasLimitedInspection = result.availability?.status === "limited_inspection";
  const showGauge =
    shouldShowTrustGauge(result) && typeof displayTrust === "number" && !hasUnavailableSite;
  const showNonexistentHeadline = result.omitTrustScoreGauge === true;

  const trustLevel = trustLevelFromScore(displayTrust ?? 0);
  const humanKind =
    alignedDisplay?.humanKind ??
    resolveHumanRecKind({
      threatActive: threat.active,
      threatKind: threat.kind,
      siteStatus: result.siteStatus,
      trustLevel,
      hasActualRiskIndicators:
        result.scoreResult.signals.some((signal) => signal.evidenceTier === "risk_indicator" && signal.impact > 0) ||
        threat.active
    });
  const humanHeadline = alignedDisplay?.humanHeadline ?? humanRecHeadline(humanKind);
  const humanTone = humanRecHeadlineTone(humanKind);
  const activeTrustLabel = humanHeadline;
  const techStatus = alignedDisplay?.label ?? technicalStatusText({
    threatActive: threat.active,
    threatKind: threat.kind,
    displayTrust,
    siteStatus: result.siteStatus
  });
  const computedShortExplain = shortScanExplanation({
    threatActive: threat.active,
    threatKind: threat.kind,
    siteStatus: result.siteStatus,
    displayTrust: displayTrust ?? 0,
    confidenceLevel: result.confidenceLevel,
    hasActualRiskIndicators:
      result.scoreResult.signals.some((signal) => signal.evidenceTier === "risk_indicator" && signal.impact > 0) || threat.active
  });
  const shortExplain = hasLimitedInspection
    ? "The website responded, but some page details could not be fully inspected during this scan."
    : computedShortExplain;
  const showLimitedStrip = shouldShowLimitedPublicStrip({
    threatActive: threat.active,
    confidenceLevel: result.confidenceLevel,
    siteStatus: result.siteStatus
  });

  const sec = EN_MESSAGES.scanResult.resultSections;

  const { reviewSignals } = result;
  const hasPublicReviewData = reviewSignals.trustpilotFound || reviewSignals.googleFound;
  const scoreTierBuckets = tierScoreSignals(result.scoreResult.signals);
  const intelTierBuckets = tierIntel(result.intelScoreBreakdown);

  const keyRisks = result.trustSignals.filter((s) => s.type === "danger" || s.type === "warning");
  const confirmedMaliciousSignals = keyRisks.filter(isConfirmedIntelTrustSignal);
  const otherRiskSignals = keyRisks.filter((s) => !isConfirmedIntelTrustSignal(s));
  const supportiveSignals = result.trustSignals.filter((s) => s.type === "positive" || s.type === "info");
  const topPositiveReasons = supportiveSignals.slice(0, 3);
  const topRiskReasons = otherRiskSignals.slice(0, 3);
  const [reputation, setReputation] = useState<ReputationEnrichment | null>(null);
  const [repLoading, setRepLoading] = useState(false);
  const [repError, setRepError] = useState<string | null>(null);
  const [devBypassCache, setDevBypassCache] = useState(false);

  const reviewAvailabilityRollup = useMemo(() => {
    const bundled = [...(reviewSignals.publicReviewAvailabilityNotes ?? [])];
    const legacySafe = reviewWarningsSafeForUi(reviewSignals.warnings);
    const merged = [...bundled, ...legacySafe];
    return [...new Set(merged)];
  }, [reviewSignals.publicReviewAvailabilityNotes, reviewSignals.warnings]);

  const sanitizedEnrichmentWarnings = useMemo(() => {
    const raw = reputation?.publicSignals?.warnings;
    return raw?.length ? sanitizePublicIntelWarningsForUi(raw) : [];
  }, [reputation]);

  const reviewFetchAudit = reviewSignals.reviewFetchDebug ?? [];

  async function loadReputationSignals(deepScan: boolean, bypassCacheOverride?: boolean) {
    setRepLoading(true);
    setRepError(null);
    try {
      const response = await fetch("/api/enrichment/reputation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          domain: result.domain,
          baseRiskScore: result.score,
          deepScan,
          confidenceLevel: result.confidenceLevel,
          missingReviewSignals: !hasPublicReviewData,
          bypassCache: bypassCacheOverride ?? devBypassCache,
          forceReputationRefresh: deepScan === true
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { enrichment?: ReputationEnrichment };
      if (process.env.NODE_ENV !== "production") {
        console.info("[ResultCard] enrichment payload", payload);
      }
      setReputation(payload.enrichment ?? null);
    } catch (e) {
      setRepError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setRepLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function load() {
      setRepLoading(true);
      setRepError(null);
      try {
        const response = await fetch("/api/enrichment/reputation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            domain: result.domain,
            baseRiskScore: result.score,
            deepScan: false,
            confidenceLevel: result.confidenceLevel,
            missingReviewSignals: !hasPublicReviewData,
            bypassCache: false
          })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as { enrichment?: ReputationEnrichment };
        if (process.env.NODE_ENV !== "production") {
          console.info("[ResultCard] enrichment payload", payload);
        }
        if (!active) return;
        setReputation(payload.enrichment ?? null);
      } catch (e) {
        if (!active) return;
        setRepError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (active) setRepLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [result.domain, result.score, result.confidenceLevel, hasPublicReviewData]);

  const trustpilotRating = reviewSignals.trustpilotRating ?? reputation?.trustpilotRating ?? reputation?.trustpilot?.rating ?? null;
  const trustpilotCount =
    reviewSignals.trustpilotReviewCount ?? reputation?.trustpilotReviewCount ?? reputation?.trustpilot?.reviewCount ?? null;
  const googleRating = reviewSignals.googleRating ?? reputation?.googleRating ?? reputation?.google?.rating ?? null;
  const googleCount = reviewSignals.googleReviewCount ?? reputation?.googleReviewCount ?? reputation?.google?.reviewCount ?? null;
  const trustpilotFound = reviewSignals.trustpilotFound || trustpilotRating != null || trustpilotCount != null;
  const googleFound = reviewSignals.googleFound || googleRating != null || googleCount != null;
  const providerLabel = providerStateLabel(reputation, repError);
  const neutralContextNotes = [
    reputation?.reputationStatus === "cache_hit" ? "Review data loaded from cache." : null,
    reputation?.reputationStatus === "called_no_match" ? "No matching public review profile found in this scan." : null,
    reputation?.reputationStatus === "provider_error" ? "Review provider unavailable during this scan." : null,
    reputation?.reputationStatus === "not_run" ? "Review enrichment was not run for this scan." : null,
    reputation?.reputationStatus === "disabled" ? "Review enrichment is not enabled." : null,
    result.confidenceLevel === "low"
      ? "Some public reputation data was limited. This affects extra context, not direct risk."
      : null
  ]
    .filter((note): note is string => Boolean(note))
    .slice(0, 3);
  const cacheLabel =
    reputation?.cacheStatus === "hit"
      ? "Result cached from previous scan"
      : reputation?.cacheStatus === "bypassed"
        ? "Cache bypassed (development)"
        : "Fresh lookup attempted";

  const meter = trustMeterTone(displayTrust ?? 0, threat.active);
  const trustedBand = typeof displayTrust === "number" && displayTrust >= 80;
  const trustedVisitUrl =
    toSafeHttpUrl(result.redirectChain?.finalUrl) ??
    toSafeHttpUrl(`https://${result.domain}`);
  const showVisitWebsiteCta =
    trustedBand &&
    trustLevel === "trusted" &&
    result.confidenceLevel !== "low" &&
    result.siteStatus !== "inactive" &&
    result.siteStatus !== "nonexistent" &&
    Boolean(trustedVisitUrl);
  const checkedHostname = result.domainIntelligence.checkedHostname ?? result.domain;
  const registeredDomain = result.registrableDomain ?? result.domainIntelligence.registrableDomain ?? result.domain;
  const isSubdomain = Boolean(result.isSubdomain ?? result.domainIntelligence.subdomain);
  const suspiciousSubTerms = result.suspiciousSubdomainTerms ?? result.domainIntelligence.suspiciousSubdomainTerms ?? [];

  return (
    <div
      className={`fraudly-motion w-full rounded-2xl bg-white p-4 shadow-subtle sm:p-5 md:p-6 ${
        threat.active
          ? "border border-rose-500/95 shadow-elevated ring-1 ring-rose-300/40"
          : "border border-slate-200/80"
      }`}
    >
      <div className="space-y-4 md:space-y-5">
        {threat.active ? (
          <ThreatBanner variant="critical" title={criticalThreatBannerTitle(threat.kind)} body={EN_MESSAGES.threatOverride.bannerBody} />
        ) : showLimitedStrip ? (
          <ThreatBanner variant="neutral" title={EN_MESSAGES.scanResult.limitedStripTitle} body={EN_MESSAGES.scanResult.limitedStripBody} />
        ) : null}

        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-5">
          <div className="min-w-0 flex-1 space-y-4 md:space-y-5">
            <header className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`select-none text-3xl sm:text-4xl ${humanTone.icon}`} aria-hidden>
                  {humanRecGlyph(humanKind)}
                </span>
                <h2 className={`text-balance text-3xl font-bold tracking-tight sm:text-4xl ${humanTone.text}`}>
                  {humanHeadline}
                </h2>
              </div>
              <p className="max-w-2xl text-base leading-relaxed text-slate-700 sm:text-[17px]">{shortExplain}</p>
              {result.adminOverride ? (
                <p className="max-w-2xl rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs leading-relaxed text-violet-800">
                  Admin override applied: <span className="font-semibold">{result.adminOverride.verdict}</span>
                  {result.adminOverride.note ? ` — ${result.adminOverride.note}` : ""}
                </p>
              ) : null}
              {result.redirectChain?.crossDomainRedirect ? (
                <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                  This website redirects to another domain. Fraudly also checked the final destination because redirects
                  can change the real risk.
                </p>
              ) : null}
              {result.availability?.status === "limited_inspection" ? (
                <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                  Website responded, but some page details could not be fully inspected during this scan.
                </p>
              ) : null}
            </header>

            <div className="max-w-2xl rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm sm:px-5 sm:py-4">
              <p className="text-sm leading-relaxed text-slate-800 sm:text-[15px] sm:leading-relaxed">
                {consumerSummaryFor(trustLevel, threat.active)}
              </p>
              <p className="mt-2 border-t border-slate-100 pt-2 text-xs leading-relaxed text-slate-500">
                {EN_MESSAGES.scanResult.consumerSummaryDisclaimer}
              </p>
            </div>

            {showVisitWebsiteCta && trustedVisitUrl ? (
              <div className="max-w-2xl rounded-xl border border-slate-200 bg-white/70 px-4 py-3 sm:px-5">
                <a
                  href={trustedVisitUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 focus-visible:ring-offset-2"
                >
                  Visit website
                  <span aria-hidden>↗</span>
                </a>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  Fraudly did not detect strong risk indicators in this scan. Always use your own judgment.
                </p>
              </div>
            ) : null}

            {showGauge && typeof displayTrust === "number" ? (
              <section className="rounded-xl border border-slate-200 bg-white px-4 py-3" aria-label={`Trust score ${displayTrust} out of 100`}>
                <p className="text-sm font-semibold text-slate-900">{activeTrustLabel}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {EN_MESSAGES.scanResult.trustScoreLabel}
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  <span className={threat.active ? "text-slate-500" : "text-slate-700"}>{displayTrust}</span>
                  <span className="text-slate-400"> / 100</span>
                </p>
                <div className="mt-3">
                  <div className={`h-2.5 w-full overflow-hidden rounded-full ${meter.track}`}>
                    <div
                      className={`h-full rounded-full ${meter.fill} transition-[width] duration-500 ease-out`}
                      style={{ width: `${Math.max(0, Math.min(100, displayTrust))}%` }}
                    />
                  </div>
                  <div className="mt-1.5 grid grid-cols-4 text-[10px] font-medium text-slate-500">
                    <span className="text-left">0</span>
                    <span className="text-center">49</span>
                    <span className="text-center">79</span>
                    <span className="text-right">100</span>
                  </div>
                </div>
                <p className="mt-2 max-w-xl text-xs leading-relaxed text-slate-600 sm:text-[13px]">
                  {EN_MESSAGES.scanResult.trustScoreExplainer}
                </p>
                <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-500">
                  {EN_MESSAGES.scanResult.trustScoreExplainerFootnote}
                </p>
                {threat.active ? (
                  <p className="mt-2 text-xs font-medium text-rose-900">
                    {EN_MESSAGES.scanResult.resultSections.trustScoreThreatNote}
                  </p>
                ) : null}
              </section>
            ) : showNonexistentHeadline ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
                <p className="text-base font-semibold text-amber-950">{EN_MESSAGES.specialOutcomes.nonexistent.headline}</p>
                <p className="mt-2 leading-relaxed">{EN_MESSAGES.specialOutcomes.nonexistent.subline}</p>
                <p className="mt-2 text-xs text-amber-900/90">{EN_MESSAGES.siteOutcome.suppressedTrustExplanation}</p>
              </div>
            ) : (
              <div className="text-sm text-slate-600">
                <p className="font-medium text-slate-800">Trust score unavailable</p>
                <p className="mt-1 text-xs text-slate-500">This snapshot did not produce a numeric trust score.</p>
              </div>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Reputation &amp; public trust</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Public review and reputation signals can help provide context, but they are not a guarantee that a website is safe.
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Positive review signals can support trust, but reviews can be incomplete or manipulated.
              </p>

              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                <article className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trustpilot</p>
                  {trustpilotFound ? (
                    <>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        <span aria-hidden className="mr-1 text-amber-500">
                          ★
                        </span>
                        {trustpilotRating?.toFixed(1) ?? "—"} / 5
                      </p>
                      <p className="mt-1 text-xs text-slate-600">{formatReviewCount(trustpilotCount ?? undefined)} reviews</p>
                    </>
                  ) : (
                    <p className="mt-1 text-xs text-slate-600">
                      {publicReviewUnavailableMessage(reputation, repError, "No public review profile found in this scan.")}
                    </p>
                  )}
                </article>

                <article className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Google Reviews</p>
                  {googleFound ? (
                    <>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        <span aria-hidden className="mr-1 text-amber-500">
                          ★
                        </span>
                        {googleRating?.toFixed(1) ?? "—"} / 5
                      </p>
                      <p className="mt-1 text-xs text-slate-600">{formatReviewCount(googleCount ?? undefined)} reviews</p>
                    </>
                  ) : (
                    <p className="mt-1 text-xs text-slate-600">
                      {publicReviewUnavailableMessage(reputation, repError, "No review snapshot available in this scan.")}
                    </p>
                  )}
                </article>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Why we say this</h3>
              {topPositiveReasons.length > 0 ? (
                <div className="mt-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Positive signals</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {topPositiveReasons.map((signal, idx) => (
                      <li key={`positive-${idx}-${signal.title}`}>{signal.title}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {topRiskReasons.length > 0 ? (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Risk indicators</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {topRiskReasons.map((signal, idx) => (
                      <li key={`risk-${idx}-${signal.title}`}>{signal.title}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {neutralContextNotes.length > 0 ? (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Extra context</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {neutralContextNotes.map((note, idx) => (
                      <li key={`neutral-${idx}-${note.slice(0, 24)}`}>{note}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:max-w-md sm:items-end sm:text-right">
            <div className="text-sm text-slate-600 sm:text-right">
              <p className="font-medium text-slate-900">{EN_MESSAGES.scanResult.resultSections.analyzedDomainHeading}</p>
              <p className="mt-1 break-all">{checkedHostname}</p>
              {registeredDomain !== checkedHostname ? (
                <p className="mt-1 text-xs text-slate-500">
                  Registered domain: <span className="font-medium text-slate-700">{registeredDomain}</span>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <details className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-5">
        <summary className="cursor-pointer list-none py-1 [&::-webkit-details-marker]:hidden">
          <span className="block text-base font-semibold text-slate-900">{EN_MESSAGES.scanResult.detailedFindingsToggle}</span>
          <span className="mt-1 block max-w-prose text-pretty text-xs font-normal leading-relaxed text-slate-500">
            {EN_MESSAGES.scanResult.detailedFindingsHint}
          </span>
        </summary>
        <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{EN_MESSAGES.scanResult.technicalStatusHeading}</p>
            <p className="mt-1 text-xs text-slate-700">{techStatus}</p>
            {result.availability ? (
              <p className="mt-2 text-xs text-slate-600">
                Availability: {result.availability.status} · {result.availability.reason}
                {result.availability.httpStatus != null ? ` (HTTP ${result.availability.httpStatus})` : ""}
              </p>
            ) : null}
            {result.availability ? (
              <p className="mt-1 text-xs text-slate-600">
                Inspection: {result.availability.contentInspectionStatus} · dns={String(result.availability.dnsResolved)} · tls=
                {String(result.availability.tlsOk)} · botProtection={String(result.availability.botProtectionDetected)} ·
                parserFailure={String(result.availability.parserFailure)} · contentLength={result.availability.contentLength}
                {result.availability.extractionFailureReason
                  ? ` · extractionReason=${result.availability.extractionFailureReason}`
                  : ""}
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{sec.confirmedIntelHeading}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{sec.confirmedIntelHint}</p>
            <SignalList
              signals={confirmedMaliciousSignals}
              empty="No Safe Browsing, OpenPhish, URLhaus, or police-aligned list matches were returned in this crawl."
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{sec.otherRiskHeading}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{sec.otherRiskHint}</p>
            <SignalList
              signals={otherRiskSignals}
              empty="No additional prioritized risk rows were raised beyond curated list matches."
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{sec.trustNotesHeading}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{sec.trustNotesHint}</p>
            <SignalList signals={supportiveSignals} empty="No supportive or informational trust rows were returned." />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{sec.domainBlockHeading}</p>
            {isSubdomain ? (
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                The submitted address is a subdomain. Fraudly also checked the registered domain because domain age and
                ownership belong to the root domain.
              </p>
            ) : null}
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-700">
              <li>
                Checked URL/hostname: <span className="font-medium">{checkedHostname}</span>
              </li>
              <li>
                Registered domain: <span className="font-medium">{registeredDomain}</span>
              </li>
              <li>
                Registration date: <span className="font-medium">{result.domainIntelligence.registrationDate ?? "unknown"}</span>
              </li>
              <li>
                Domain age (days): <span className="font-medium">{result.domainIntelligence.ageDays ?? "unknown"}</span>
              </li>
              <li>
                Registrar: <span className="font-medium">{result.domainIntelligence.registrar ?? "unknown"}</span>
              </li>
              <li>
                Country: <span className="font-medium">{result.domainIntelligence.country ?? "unknown"}</span>
              </li>
              <li>
                Expiration date: <span className="font-medium">{result.domainIntelligence.expirationDate ?? "unknown"}</span>
              </li>
              <li>
                Privacy / redacted ownership hints:{" "}
                <span className="font-medium">{result.domainIntelligence.hasPrivacyProtection ? "yes" : "no / unknown"}</span>
              </li>
              {isSubdomain ? (
                <li>
                  Subdomain analysis:{" "}
                  <span className="font-medium">
                    {suspiciousSubTerms.length > 0
                      ? `Potentially risky wording found (${suspiciousSubTerms.join(", ")}).`
                      : "No high-risk wording detected in subdomain labels."}
                  </span>
                </li>
              ) : null}
            </ul>
            <p className="mt-2 text-xs text-slate-500">Source: {result.domainIntelligence.source}</p>
          </div>

          {result.redirectChain ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">Redirect analysis</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-700">
                <li>
                  Original URL: <span className="font-medium break-all">{result.redirectChain.originalUrl}</span>
                </li>
                <li>
                  Final URL: <span className="font-medium break-all">{result.redirectChain.finalUrl}</span>
                </li>
                <li>
                  Final domain: <span className="font-medium">{result.redirectChain.finalDomain}</span>
                </li>
                <li>
                  Redirect count: <span className="font-medium">{result.redirectChain.redirectCount}</span>
                </li>
                <li>
                  Crossed registrable domain:{" "}
                  <span className="font-medium">{result.redirectChain.crossDomainRedirect ? "yes" : "no"}</span>
                </li>
                {result.redirectChain.tooManyRedirects ? (
                  <li>
                    Redirect chain state: <span className="font-medium">Stopped after maximum redirect limit.</span>
                  </li>
                ) : null}
                {result.redirectChain.timedOut ? (
                  <li>
                    Redirect chain state: <span className="font-medium">Resolution timed out before final confirmation.</span>
                  </li>
                ) : null}
                {result.redirectChain.error ? (
                  <li>
                    Redirect resolver note: <span className="font-medium">{result.redirectChain.error}</span>
                  </li>
                ) : null}
              </ul>
              {result.redirectChain.redirectChain.length > 0 ? (
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-slate-600">
                  {result.redirectChain.redirectChain.map((hop, idx) => (
                    <li key={`${idx}-${hop}`} className="break-all">
                      {hop}
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">{sec.sslBlockHeading}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-700">
          <li>
            HTTPS/TLS reachable:{" "}
            <span className="font-medium">{result.ssl.httpsEnabled ? "yes" : "no"}</span>
          </li>
          <li>
            Certificate trusted in probe:{" "}
            <span className="font-medium">{result.ssl.validCertificate ? "yes" : "no"}</span>
          </li>
          <li>
            Possibly self-signed / untrusted:{" "}
            <span className="font-medium">{result.ssl.selfSigned ? "possible" : "no / unknown"}</span>
          </li>
          <li>
            Issuer: <span className="font-medium">{result.ssl.certificateIssuer ?? "unknown"}</span>
          </li>
          <li>
            Expiry: <span className="font-medium">{result.ssl.certificateExpiry ?? "unknown"}</span>
          </li>
        </ul>
        <p className="mt-2 text-xs text-slate-500">Source: {result.ssl.source}</p>
      </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{sec.intelProvidersHeading}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{sec.intelProvidersHint}</p>
        {result.providerEvidence.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No modular provider rows were recorded.</p>
        ) : (
          <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto text-sm">
            {result.providerEvidence.map((row, index) => (
              <li key={`${row.source}-${index}-${row.title}`} className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-semibold text-slate-900">{row.title}</span>
                  <span className="text-xs uppercase tracking-wide text-slate-500">{row.category}</span>
                  {row.matched ? (
                    <span className="rounded bg-amber-100 px-1.5 text-xs font-medium text-amber-900">matched</span>
                  ) : (
                    <span className="rounded bg-slate-200 px-1.5 text-xs font-medium text-slate-700">no match</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-700">{row.description}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Source: {row.source} · severity: {row.severity} · {EN_MESSAGES.scanResult.providerRowReliability}:{" "}
                  {row.confidence}
                </p>
              </li>
            ))}
          </ul>
        )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{sec.reputationBlockHeading}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{sec.reputationBlockHint}</p>
            {repLoading ? (
          <p className="mt-2 text-sm text-slate-600">{sec.reputationChecking}</p>
        ) : repError ? (
          <p className="mt-2 text-sm text-slate-600">{sec.reputationUnavailable}</p>
        ) : reputation ? (
          <div className="mt-2 space-y-2 text-sm text-slate-700">
            <ReviewSummary enrichment={reputation} />
            {reputation.publicSignals ? (
              <ul className="list-disc space-y-1 pl-5 text-xs text-slate-700">
                <li>
                  Reddit warnings: <span className="font-medium">{reputation.publicSignals.redditWarnings}</span>
                </li>
                <li>
                  Domain age (days): <span className="font-medium">{reputation.publicSignals.domainAgeDays ?? "unknown"}</span>
                </li>
                <li>
                  SSL status: <span className="font-medium">{reputation.publicSignals.sslStatus}</span>
                </li>
                <li>
                  DNS/mail configuration:{" "}
                  <span className="font-medium">
                    {reputation.publicSignals.mailSecurity
                      ? `MX:${reputation.publicSignals.mailSecurity.mxConfigured ? "yes" : "no"}, SPF:${reputation.publicSignals.mailSecurity.spf ? "yes" : "no"}, DMARC:${reputation.publicSignals.mailSecurity.dmarc ? "yes" : "no"}`
                      : "unavailable"}
                  </span>
                </li>
                <li>
                  {EN_MESSAGES.scanResult.enrichmentCompletenessLabel}:{" "}
                  <span className="font-medium">{reputation.publicSignals.confidence}</span>
                </li>
              </ul>
            ) : null}
            <p>
              Last updated: <span className="font-medium">{new Date(reputation.lastUpdated).toLocaleString("en")}</span>
            </p>
            <p>
              Estimated impact:{" "}
              <span className="font-medium">
                {reputation.impactOnRisk > 0 ? "+" : ""}
                {reputation.impactOnRisk} risk points
              </span>
            </p>
            <p>
              Provider summary:{" "}
              <span className="font-medium">
                {providerStateLabel(reputation, repError)} · {cacheLabel}
              </span>
            </p>
            <p>
              Matched query: <span className="font-medium">{reputation.matchedQuery ?? result.domain}</span>
            </p>
            <p>
              Matched profile/domain:{" "}
              <span className="font-medium">{reputation.businessName ?? reputation.normalizedDomain}</span>
            </p>
            {result.adminOverride ? (
              <p>
                Admin override:{" "}
                <span className="font-medium">
                  {result.adminOverride.verdict}
                  {result.adminOverride.note ? ` (${result.adminOverride.note})` : ""}
                </span>
              </p>
            ) : null}
            {reputation.reputationDebug ? (
              <p className="text-xs text-slate-600">
                Debug: enabled={String(reputation.reputationDebug.enabled)}; apiKeyPresent=
                {String(reputation.reputationDebug.apiKeyPresent)}; calledProvider=
                {String(reputation.reputationDebug.calledProvider)}; providerStatus=
                {reputation.reputationDebug.providerStatus}; skippedReason=
                {reputation.reputationDebug.skippedReason ?? "none"}; normalizedDomain=
                {reputation.reputationDebug.normalizedDomain}
              </p>
            ) : null}
            {reputation.sentimentSummary ? <p className="text-xs text-slate-600">{reputation.sentimentSummary}</p> : null}
            {reputation.message ? <p className="text-xs text-slate-500">{reputation.message}</p> : null}
            {sanitizedEnrichmentWarnings.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600">
                {sanitizedEnrichmentWarnings.map((warning, i) => (
                  <li key={`${i}-${warning.slice(0, 24)}`}>{warning}</li>
                ))}
              </ul>
            ) : null}
            <button
              type="button"
              onClick={() => void loadReputationSignals(true)}
              className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Run deep scan
            </button>
            {process.env.NODE_ENV !== "production" ? (
              <button
                type="button"
                className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  const next = !devBypassCache;
                  setDevBypassCache(next);
                  void loadReputationSignals(false, next);
                }}
              >
                {devBypassCache ? "Disable cache bypass" : "Bypass cache and refresh"}
              </button>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">{sec.reputationEmptyHint}</p>
        )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{sec.baselineReviewsHeading}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{sec.baselineReviewsHint}</p>
        {hasPublicReviewData ? (
          <div className="mt-2 space-y-2 text-sm text-slate-700">
            {reviewSignals.googleFound && (
              <div>
                <p className="font-medium text-slate-900">Indexed review snippets probe</p>
                <p>
                  Rating estimate:{" "}
                  <span className="font-medium">{reviewSignals.googleRating?.toFixed(1) ?? "n/a"}</span>
                </p>
                <p>
                  Review count estimate: <span className="font-medium">{reviewSignals.googleReviewCount ?? "n/a"}</span>
                </p>
              </div>
            )}
            {reviewSignals.trustpilotFound && (
              <div>
                <p className="font-medium text-slate-900">Trust snapshot probe</p>
                <p>
                  Rating:{" "}
                  <span className="font-medium">{reviewSignals.trustpilotRating?.toFixed(1) ?? "n/a"}</span>
                </p>
                <p>
                  Review count: <span className="font-medium">{reviewSignals.trustpilotReviewCount ?? "n/a"}</span>
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">{EN_MESSAGES.reviewEvidence.reviewDataUnavailable}</p>
        )}

        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {reviewSignals.suspiciousReviewSignals.map((signal, index) => (
            <li key={`${index}-${signal.slice(0, 40)}`}>{signal}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-500">{result.reviewSummary}</p>
        {reviewAvailabilityRollup.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
            {reviewAvailabilityRollup.map((line, i) => (
              <li key={`${i}-${line.slice(0, 48)}`}>{line}</li>
            ))}
          </ul>
        ) : null}
        {reviewFetchAudit.length > 0 ? (
          <details className="mt-3 rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
            <summary className="cursor-pointer font-medium text-slate-800">Source availability (neutral)</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
              {reviewFetchAudit.map((entry, idx) => (
                <li key={`${idx}-${entry.source}-${entry.bucket}`}>{neutralLabelForReviewDebugEntry(entry)}</li>
              ))}
            </ul>
          </details>
        ) : null}
        {/* TODO(review-raw-snapshots): include provider raw payload snippets once collectors expose structured snapshot JSON. */}
        <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-600">
          <p className="font-medium text-slate-700">Raw review snapshots</p>
          <p className="mt-1">Trustpilot raw snapshot: not available in current payload.</p>
          <p className="mt-1">Google reviews raw snapshot: not available in current payload.</p>
        </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{sec.supplyChainHeading}</p>
        <p className="mt-2 text-xs text-slate-600">
          Dropshipping: {result.supplyChainSignals.likelyDropshipping ? "likely" : "unlikely"} · China-linked
          fulfillment: {result.supplyChainSignals.likelyChinaShipping ? "likely" : "unlikely"} · Local
          stock/production: {result.supplyChainSignals.likelyLocalProduction ? "likely" : "unlikely"} · Confidence:{" "}
          {result.supplyChainSignals.confidence} · Score nudge: {result.supplyChainSignals.scoreAdjustment > 0 ? "+" : ""}
          {result.supplyChainSignals.scoreAdjustment}
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-700">
          {result.supplyChainSignals.reasons.map((r, i) => (
            <li key={`${i}-${r.slice(0, 48)}`}>{r}</li>
          ))}
        </ul>
          </div>

          <details className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm">
            <summary className="cursor-pointer font-semibold text-slate-900">{sec.scoreDebugToggle}</summary>
        <p className="mt-2 text-xs text-slate-500">
          Composite model uses raw impacts × confidence weights on the server. Positive numbers push the risk score up;
          negative numbers pull it down. Neutral rows are explanatory only — they must not be read as endorsement.
        </p>
        {typeof result.scoreResult.trustScoreCap === "number" ? (
          <p className="mt-2 text-xs text-slate-600">
            Applied trust-score cap after identity guardrails: {result.scoreResult.trustScoreCap}/100 displayed trust.
          </p>
        ) : null}
        {result.scoreResult.trustedBlockedReason === "no_trust_anchor" ? (
          <p className="mt-2 text-xs text-amber-800">
            “Trusted” was withheld because reputation or RDAP lifecycle evidence did not independently anchor identity for
            this snapshot.
          </p>
        ) : null}

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-600">{sec.scoreDebugCombinedHeading}</p>
        {result.scoreResult.signals.length === 0 ? (
          <p className="mt-2 text-xs text-slate-600">No modeled signals captured.</p>
        ) : (
          <div className="mt-2 space-y-3">
            {TIER_ORDER.map((tier) => {
              const grouped = scoreTierBuckets[tier];
              if (grouped.length === 0) return null;
              return (
                <div key={`score-${tier}`}>
                  <p className="text-xs font-semibold text-slate-800">{labelForEvidenceTier(tier)}</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-700">
                    {grouped.map((row) => (
                      <li key={row.id}>
                        <span className="font-medium">{row.label}</span> ({row.impact >= 0 ? "+" : ""}
                        {row.impact} raw · {row.confidence} confidence) — {row.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-600">{sec.scoreDebugTierHeading}</p>
        {result.intelScoreBreakdown.length === 0 ? (
          <p className="mt-2 text-xs text-slate-600">No weighted intel contributions in this run.</p>
        ) : (
          <div className="mt-2 space-y-3">
            {TIER_ORDER.map((tier) => {
              const grouped = intelTierBuckets[tier];
              if (grouped.length === 0) return null;
              return (
                <div key={`intel-${tier}`}>
                  <p className="text-xs font-semibold text-slate-800">{labelForEvidenceTier(tier)}</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-700">
                    {grouped.map((row) => (
                      <li key={row.id}>
                        <span className="font-medium">{row.label}</span> ({row.impact >= 0 ? "+" : ""}
                        {row.impact} raw · {row.confidence} confidence) — {row.rationale}
                        {row.source ? <span className="text-slate-500"> · {row.source}</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-600">{sec.scoreDebugBaselineHeading}</p>
        <p className="mt-1 text-xs text-slate-500">
          Buckets distinguish provider errors, source outages, review-derived signals, and (rare) website crawler transparency—never merged with fraud intel.
        </p>
        {reviewFetchAudit.length === 0 ? (
          <p className="mt-2 text-xs text-slate-600">No bookkeeping rows for the quick review collectors.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-xs text-slate-700">
            {reviewFetchAudit.map((entry, idx) => (
              <li key={`dbg-${idx}-${entry.source}-${entry.bucket}`}>
                <span className="font-mono text-[10px] uppercase text-slate-500">
                  {entry.source} · {entry.bucket}
                </span>
                {": "}
                {neutralLabelForReviewDebugEntry(entry)}
              </li>
            ))}
          </ul>
        )}
          </details>

          {result.trustEvidence ? (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{EN_MESSAGES.scanResult.resultSections.optionalEvidenceHeading}</p>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600">
                  {EN_MESSAGES.scanResult.resultSections.optionalEvidenceBody}
                </p>
              </div>
              {result.trustEvidence.screenshotAd ? <EvidenceSignalsCard section={result.trustEvidence.screenshotAd} /> : null}
              {result.trustEvidence.webshop ? <EvidenceSignalsCard section={result.trustEvidence.webshop} /> : null}
              {result.trustEvidence.socialAd ? <EvidenceSignalsCard section={result.trustEvidence.socialAd} /> : null}
            </div>
          ) : null}

          {result.siteStatus === "inactive" ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-800">
              <p className="font-semibold text-slate-900">{EN_MESSAGES.specialOutcomes.inactive.headline}</p>
              <p className="mt-2 leading-relaxed">{EN_MESSAGES.specialOutcomes.inactive.explain}</p>
              <p className="mt-2 text-xs text-slate-600">{EN_MESSAGES.specialOutcomes.inactive.crawlNote}</p>
            </div>
          ) : null}

          {result.domainInfrastructure.treatAsNonExistentHost ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-950">
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-rose-800/90">
                    {EN_MESSAGES.domainInfrastructure.domainStatusHeading}
                  </dt>
                  <dd className="mt-1 text-base font-semibold">{EN_MESSAGES.domainInfrastructure.notRegisteredLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-rose-800/90">
                    {EN_MESSAGES.domainInfrastructure.riskLevelHeading}
                  </dt>
                  <dd className="mt-1 text-base font-semibold">{EN_MESSAGES.domainInfrastructure.highRiskInvalidLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-rose-800/90">
                    {EN_MESSAGES.domainInfrastructure.reasonHeading}
                  </dt>
                  <dd className="mt-1 leading-relaxed text-rose-950/95">
                    {EN_MESSAGES.domainInfrastructure.invalidHostExplanation}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{sec.aiFactorsHeading}</p>
            <p className="mt-1 max-w-prose text-pretty text-xs leading-relaxed text-slate-500">{sec.aiFactorsHint}</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
              {result.reasons.map((reason, index) => (
                <li key={`${index}-${reason.slice(0, 48)}`}>{reason}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">AI model used in this run: {result.aiUsed ? "yes" : "no"}</p>
          </div>
        </div>
      </details>

      <ResultSupportBox className="mt-6" />

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs leading-relaxed text-slate-600">
        {EN_MESSAGES.scanResult.footerDisclaimer}
      </div>
    </div>
  );
}
