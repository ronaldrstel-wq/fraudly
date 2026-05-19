"use client";

import { useEffect, useMemo, useState } from "react";
import { PublicReviewChannelCard } from "@/components/reputation/PublicReviewChannelCard";
import { ReviewSummary } from "@/components/ReviewSummary";
import { heroPreviewReasonsForResult } from "@/lib/signals/normalizeConsumerSignals";
import { normalizeTrustResult, trustHighlightsFromNormalized } from "@/lib/trust/normalizeTrustResult";
import type { NormalizedTrustResult } from "@/lib/trust/types";
import type { ConsumerVerdictLabel } from "@/lib/trust/types";
import { riskScoreFromTrust } from "@/lib/scoring/displayScore";
import { logComponentTrustIntegrity } from "@/lib/scoring/componentIntegrity";
import { inferIntelEvidenceTier, type IntelScoreBreakdownEntry } from "@/lib/checks/scoring";
import type { TrustSignal } from "@/lib/checks/types";
import { inferScoreEvidenceTier, type ScoreEvidenceTier, type ScoreSignal } from "@/lib/scoringEngine";
import {
  neutralLabelForReviewDebugEntry,
  reviewWarningsSafeForUi,
  sanitizePublicIntelWarningsForUi
} from "@/lib/reviewSourceNormalization";
import { assessCriticalThreat, criticalThreatBannerTitle } from "@/lib/scanPresentation";
import {
  humanRecHeadline,
  resolveHumanRecKind,
  shortScanExplanation,
  technicalStatusText
} from "@/lib/scanResultDualLayer";
import { ThreatBanner } from "@/components/ThreatBanner";
import { VerdictHero } from "@/components/result/VerdictHero";
import { ResultSupportBox } from "@/components/ResultSupportBox";
import { useResultFlow } from "@/components/i18n/useResultFlow";
import { shouldShowTrustGauge } from "@/lib/trustGaugeDisplay";
import { trustLevelFromScore, trustMeterColors, type TrustLevel } from "@/lib/trustSystem";
import { getTrustColorsForDisplay, getTrustPresentation } from "@/lib/scoring/trust-bands";
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
  /** Canonical consumer trust view — required for consistent score/signals across surfaces. */
  normalizedTrust?: NormalizedTrustResult;
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

function SignalList({
  signals,
  empty,
  flow
}: {
  signals: TrustSignal[];
  empty: string;
  flow: ReturnType<typeof useResultFlow>;
}) {
  if (signals.length === 0) return <p className="mt-2 text-sm text-slate-600">{empty}</p>;
  return (
    <ul className="mt-3 space-y-2">
      {signals.map((signal, index) => (
        <li key={`${index}-${signal.title}`} className={`rounded-lg border px-3 py-2 text-sm ${toneForTrustSignal(signal)}`}>
          <p className="font-semibold">{signal.title}</p>
          <p className="mt-0.5">{signal.description}</p>
          <div className="mt-1 flex flex-wrap gap-x-2 text-xs opacity-80">
            {signal.source ? (
              <span>
                {flow.checkPage.resultCardUi.signalSourcePrefix} {signal.source}
              </span>
            ) : null}
            {signal.confidence ? (
              <span>
                {flow.scanResult.signalReliability}: {signal.confidence}
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

function labelForEvidenceTier(tier: ScoreEvidenceTier, flow: ReturnType<typeof useResultFlow>): string {
  return flow.scanResult.evidenceTierLabels[tier];
}

function consumerSummaryFor(
  trustLevel: TrustLevel,
  threatActive: boolean,
  flow: ReturnType<typeof useResultFlow>
): string {
  if (threatActive) return flow.scanResult.consumerSummary.underThreat;
  if (trustLevel === "trusted" || trustLevel === "mostlySafe") return flow.scanResult.consumerSummary.positive;
  if (trustLevel === "caution") return flow.scanResult.consumerSummary.mixed;
  return flow.scanResult.consumerSummary.elevated;
}

function trustMeterTone(score: number, threatActive: boolean): {
  track: string;
  fill: string;
  marker: string;
} {
  const meter = trustMeterColors(score, threatActive);
  const presentation = getTrustPresentation(score);
  return {
    track: meter.meterTrack,
    fill: meter.meterFill,
    marker: presentation.colors.meterMarker
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

function labelForScanCoverage(level: ConfidenceLevel, flow: ReturnType<typeof useResultFlow>): string {
  switch (level) {
    case "high":
      return flow.siteOutcome.scanCoverageHighLabel;
    case "medium":
      return flow.siteOutcome.scanCoverageMediumLabel;
    case "low":
      return flow.siteOutcome.scanCoverageLowLabel;
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

export function ResultCard({ result, normalizedTrust, alignedDisplay }: ResultCardProps) {
  const flow = useResultFlow();
  const ui = flow.checkPage.resultCardUi;
  const rows = flow.checkPage.domainRows;
  const empty = flow.checkPage.emptySignals;
  const safeResult = result;
  const normalized = useMemo(() => {
    if (normalizedTrust) return normalizedTrust;
    return normalizeTrustResult(safeResult, {
      displayLock: alignedDisplay
        ? {
            riskScore: riskScoreFromTrust(alignedDisplay.trustScore),
            trustScore: alignedDisplay.trustScore,
            verdict: alignedDisplay.label as ConsumerVerdictLabel,
            scanId: alignedDisplay.scanId,
            source: "aligned_display"
          }
        : null,
      route: "ResultCard"
    });
  }, [safeResult, normalizedTrust, alignedDisplay]);

  useEffect(() => {
    logComponentTrustIntegrity({
      component: "ResultCard",
      domain: safeResult.domain,
      trustScore: normalized.trustScore,
      riskScore: normalized.riskScore,
      consumerVerdictLabel: normalized.verdict,
      legacyVerdict: safeResult.verdict
    });
  }, [safeResult.domain, safeResult.verdict, normalized.trustScore, normalized.riskScore, normalized.verdict]);

  const scoreSignals = safeResult.scoreResult?.signals ?? [];
  const trustSignals = safeResult.trustSignals ?? [];
  const threat = assessCriticalThreat(safeResult);
  const displayTrust = normalized.trustScore;
  const hasUnavailableSite = safeResult.availability?.status === "unavailable" || safeResult.siteStatus === "inactive";
  const hasLimitedInspection = safeResult.availability?.status === "limited_inspection";
  const showGauge =
    shouldShowTrustGauge(safeResult) && typeof displayTrust === "number" && !hasUnavailableSite;
  const showNonexistentHeadline = safeResult.omitTrustScoreGauge === true;

  const trustLevel = trustLevelFromScore(displayTrust ?? 0);
  const humanKind =
    alignedDisplay?.humanKind ??
    resolveHumanRecKind({
      threatActive: threat.active,
      threatKind: threat.kind,
      siteStatus: safeResult.siteStatus,
      trustLevel,
      hasActualRiskIndicators:
        scoreSignals.some((signal) => signal.evidenceTier === "risk_indicator" && signal.impact > 0) ||
        threat.active
    });
  const humanHeadline = alignedDisplay?.humanHeadline ?? humanRecHeadline(humanKind, flow);
  const primaryVerdict =
    threat.active || humanKind === "avoidWebsite" || humanKind === "dangerousWebsite"
      ? "High Risk"
      : normalized.verdict || humanHeadline || flow.checkPage.fallbackVerdict;
  const techStatus =
    alignedDisplay?.label ??
    technicalStatusText(
      {
        threatActive: threat.active,
        threatKind: threat.kind,
        displayTrust,
        siteStatus: safeResult.siteStatus
      },
      flow
    );
  const computedShortExplain = shortScanExplanation(
    {
      threatActive: threat.active,
      threatKind: threat.kind,
      siteStatus: safeResult.siteStatus,
      displayTrust: displayTrust ?? 0,
      confidenceLevel: safeResult.confidenceLevel ?? "medium",
      hasActualRiskIndicators:
        scoreSignals.some((signal) => signal.evidenceTier === "risk_indicator" && signal.impact > 0) || threat.active
    },
    flow
  );
  const shortExplain = hasLimitedInspection ? flow.checkPage.limitedInspection : computedShortExplain;
  const showLimitedStrip = normalized.showLimitedPublicStrip;

  const sec = flow.scanResult.resultSections;

  const reviewSignals = safeResult.reviewSignals ?? {
    googleFound: false,
    trustpilotFound: false,
    suspiciousReviewSignals: [],
    sources: [],
    warnings: [],
    publicReviewAvailabilityNotes: [],
    reviewFetchDebug: []
  };
  const hasPublicReviewData = reviewSignals.trustpilotFound || reviewSignals.googleFound;
  const scoreTierBuckets = tierScoreSignals(scoreSignals);
  const intelTierBuckets = tierIntel(safeResult.intelScoreBreakdown ?? []);

  const keyRisks = trustSignals.filter((s) => s.type === "danger" || s.type === "warning");
  const confirmedMaliciousSignals = keyRisks.filter(isConfirmedIntelTrustSignal);
  const otherRiskSignals = keyRisks.filter((s) => !isConfirmedIntelTrustSignal(s));
  const supportiveSignals = trustSignals.filter((s) => s.type === "positive" || s.type === "info");
  const consumerSafetySignals = useMemo(
    () => ({ helpful: normalized.helpfulSignals, watch: normalized.cautionSignals }),
    [normalized]
  );
  const heroTrustHighlights = useMemo(() => trustHighlightsFromNormalized(normalized), [normalized]);
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

  const providerLabel = providerStateLabel(reputation, repError);
  const neutralContextNotes = useMemo(() => {
    const note = normalized.reputation.optionalUnavailableNote;
    return note ? [note] : [];
  }, [normalized]);
  const cacheLabel =
    reputation?.cacheStatus === "hit"
      ? "Result cached from previous scan"
      : reputation?.cacheStatus === "bypassed"
        ? "Cache bypassed (development)"
        : "Fresh lookup attempted";

  const meter = trustMeterTone(displayTrust ?? 0, threat.active);
  const trustedBand = typeof displayTrust === "number" && displayTrust >= 85;
  const trustedVisitUrl =
    toSafeHttpUrl(result.redirectChain?.finalUrl) ??
    toSafeHttpUrl(`https://${result.domain}`);
  const showVisitWebsiteCta =
    trustedBand &&
    normalized.verdict === "Likely Safe" &&
    result.siteStatus !== "inactive" &&
    result.siteStatus !== "nonexistent" &&
    Boolean(trustedVisitUrl);
  const checkedHostname = result.domainIntelligence.checkedHostname ?? result.domain;
  const registeredDomain = result.registrableDomain ?? result.domainIntelligence.registrableDomain ?? result.domain;
  const isSubdomain = Boolean(result.isSubdomain ?? result.domainIntelligence.subdomain);
  const suspiciousSubTerms = result.suspiciousSubdomainTerms ?? result.domainIntelligence.suspiciousSubdomainTerms ?? [];

  const heroSummary =
    (threat.active
      ? flow.scanResult.consumerSummary.underThreat
      : hasLimitedInspection
        ? shortExplain
        : normalized.summary) || flow.checkPage.fallbackSummary;
  const topReasonLines = heroPreviewReasonsForResult(safeResult);
  const heroTrustScore =
    showNonexistentHeadline || hasUnavailableSite
      ? null
      : typeof displayTrust === "number"
        ? displayTrust
        : null;

  const resultCardColors = getTrustColorsForDisplay(
    heroTrustScore,
    primaryVerdict as ConsumerVerdictLabel
  );
  const resultCardShell = threat.active
    ? "border border-rose-300/80 bg-white shadow-elevated"
    : `${resultCardColors.border} ${resultCardColors.surfaceGradient}`;

  return (
    <div className={`fraudly-motion w-full rounded-2xl p-4 shadow-subtle sm:p-5 md:p-6 ${resultCardShell}`}>
      <div className="space-y-4 md:space-y-5">
        {threat.active ? (
          <ThreatBanner
            variant="critical"
            title={criticalThreatBannerTitle(threat.kind, flow)}
            body={flow.threatOverride.bannerBody}
          />
        ) : showLimitedStrip ? (
          <ThreatBanner variant="neutral" title={flow.scanResult.limitedStripTitle} body={flow.scanResult.limitedStripBody} />
        ) : null}

        <div className="space-y-5">
          <VerdictHero
            verdict={primaryVerdict}
            trustScore={heroTrustScore}
            summary={heroSummary}
            domain={checkedHostname}
            showMeter={showGauge && typeof heroTrustScore === "number"}
            meter={meter}
            topReasons={topReasonLines}
            trustHighlights={heroTrustHighlights}
          />

          {result.adminOverride ? (
            <p className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-xs leading-relaxed text-violet-800">
              Admin override applied: <span className="font-semibold">{result.adminOverride.verdict}</span>
              {result.adminOverride.note ? ` — ${result.adminOverride.note}` : ""}
            </p>
          ) : null}
          {result.redirectChain?.crossDomainRedirect ? (
            <p className="text-sm leading-relaxed text-slate-600">{ui.redirectNotice}</p>
          ) : null}
          {hasLimitedInspection && !threat.active ? (
            <p className="text-sm leading-relaxed text-slate-600">{ui.limitedInspectionShort}</p>
          ) : null}

          {showNonexistentHeadline ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
              <p className="text-base font-semibold text-amber-950">{flow.specialOutcomes.nonexistent.headline}</p>
              <p className="mt-2 leading-relaxed">{flow.specialOutcomes.nonexistent.subline}</p>
              <p className="mt-2 text-xs text-amber-900/90">{flow.siteOutcome.suppressedTrustExplanation}</p>
            </div>
          ) : heroTrustScore == null && !showNonexistentHeadline ? (
            <p className="text-sm text-slate-600">{ui.trustScoreUnavailable}</p>
          ) : null}

          {showVisitWebsiteCta && trustedVisitUrl ? (
              <div className="max-w-2xl rounded-xl border border-slate-200 bg-white/70 px-4 py-3 sm:px-5">
                <a
                  href={trustedVisitUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 focus-visible:ring-offset-2"
                >
                  {flow.checkPage.visitWebsiteCta}
                  <span aria-hidden>↗</span>
                </a>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{flow.checkPage.visitWebsiteDisclaimer}</p>
              </div>
            ) : null}

          <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
            <h3 className="text-sm font-semibold text-slate-900">{flow.scanResult.whyThisResultHeading}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{flow.scanResult.whyThisResultIntro}</p>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">{flow.scanResult.consumerSummaryDisclaimer}</p>
            {registeredDomain !== checkedHostname ? (
              <p className="mt-2 text-xs text-slate-500">
                {ui.registeredDomainLabel}{" "}
                <span className="font-medium text-slate-700">{registeredDomain}</span>
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
            <h3 className="text-sm font-semibold text-slate-900">{flow.scanResult.reputationHeading}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{flow.scanResult.reputationIntro}</p>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              <PublicReviewChannelCard
                source="Trustpilot"
                channel={normalized.reputation.trustpilot}
                matchNote={normalized.reputation.trustpilotMatchNote}
              />
              <PublicReviewChannelCard
                source="Google Reviews"
                channel={normalized.reputation.google}
                matchNote={normalized.reputation.googleMatchNote}
              />
              </div>
            </section>

          {consumerSafetySignals.helpful.length > 0 ||
          consumerSafetySignals.watch.length > 0 ||
          neutralContextNotes.length > 0 ? (
            <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
              <h3 className="text-sm font-semibold text-slate-900">{flow.scanResult.safetySignalsHeading}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{flow.scanResult.safetySignalsIntro}</p>
              {consumerSafetySignals.helpful.length > 0 ? (
                <div className="mt-3">
                  <p className="text-xs font-medium text-emerald-800">Helpful signals</p>
                  <ul className="mt-1.5 space-y-1.5 text-sm text-slate-700">
                    {consumerSafetySignals.helpful.map((line) => (
                      <li key={`positive-${line.slice(0, 48)}`} className="flex gap-2">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-400" aria-hidden />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {consumerSafetySignals.watch.length > 0 ? (
                <div className="mt-3">
                  <p className="text-xs font-medium text-amber-900">Things to watch</p>
                  <ul className="mt-1.5 space-y-1.5 text-sm text-slate-700">
                    {consumerSafetySignals.watch.map((line) => (
                      <li key={`risk-${line.slice(0, 48)}`} className="flex gap-2">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-400" aria-hidden />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {neutralContextNotes.length > 0 ? (
                <ul className="mt-3 space-y-1 text-xs text-slate-600">
                  {neutralContextNotes.map((note, idx) => (
                    <li key={`neutral-${idx}-${note.slice(0, 24)}`}>{note}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>

      <details className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-5">
        <summary className="cursor-pointer list-none py-1 [&::-webkit-details-marker]:hidden">
          <span className="block text-base font-semibold text-slate-900">{flow.scanResult.detailedFindingsToggle}</span>
          <span className="mt-1 block max-w-prose text-pretty text-xs font-normal leading-relaxed text-slate-500">
            {flow.scanResult.detailedFindingsHint}
          </span>
        </summary>
        <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
          {typeof heroTrustScore === "number" ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">{flow.scanResult.trustScoreLabel}</p>
              <p className="mt-1 text-sm tabular-nums text-slate-800">
                {heroTrustScore}
                <span className="text-slate-400"> / 100</span>
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{flow.scanResult.trustScoreExplainer}</p>
              {threat.active ? (
                <p className="mt-2 text-xs text-rose-900">{flow.scanResult.resultSections.trustScoreThreatNote}</p>
              ) : null}
            </div>
          ) : null}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{flow.scanResult.technicalStatusHeading}</p>
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
              empty={empty.confirmedIntel}
              flow={flow}
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{sec.otherRiskHeading}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{sec.otherRiskHint}</p>
            <SignalList
              signals={otherRiskSignals}
              empty={empty.otherRisk}
              flow={flow}
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{sec.trustNotesHeading}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{sec.trustNotesHint}</p>
            <SignalList
              signals={supportiveSignals}
              empty={empty.supportive}
              flow={flow}
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{sec.domainBlockHeading}</p>
            {isSubdomain ? (
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{ui.subdomainNote}</p>
            ) : null}
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-700">
              <li>
                {rows.checkedHostname} <span className="font-medium">{checkedHostname}</span>
              </li>
              <li>
                {rows.registeredDomain} <span className="font-medium">{registeredDomain}</span>
              </li>
              <li>
                {rows.registrationDate}{" "}
                <span className="font-medium">{result.domainIntelligence.registrationDate ?? rows.unknown}</span>
              </li>
              <li>
                {rows.domainAge}{" "}
                <span className="font-medium">
                  {normalized.domainAge.display}
                </span>
              </li>
              <li>
                {rows.registrar}{" "}
                <span className="font-medium">{result.domainIntelligence.registrar ?? rows.unknown}</span>
              </li>
              <li>
                {rows.country}{" "}
                <span className="font-medium">{result.domainIntelligence.country ?? rows.unknown}</span>
              </li>
              <li>
                {rows.expirationDate}{" "}
                <span className="font-medium">{result.domainIntelligence.expirationDate ?? rows.unknown}</span>
              </li>
              <li>
                {rows.privacyHints}{" "}
                <span className="font-medium">
                  {result.domainIntelligence.hasPrivacyProtection ? rows.yes : rows.noOrUnknown}
                </span>
              </li>
              {isSubdomain ? (
                <li>
                  {rows.subdomainAnalysis}{" "}
                  <span className="font-medium">
                    {suspiciousSubTerms.length > 0
                      ? rows.subdomainRisky.replace("{terms}", suspiciousSubTerms.join(", "))
                      : rows.subdomainClean}
                  </span>
                </li>
              ) : null}
            </ul>
            <p className="mt-2 text-xs text-slate-500">
              {rows.sourcePrefix} {result.domainIntelligence.source}
            </p>
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
                  Source: {row.source} · severity: {row.severity} · {flow.scanResult.providerRowReliability}:{" "}
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
                  Domain age:{" "}
                  <span className="font-medium">{normalized.domainAge.display}</span>
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
                  {flow.scanResult.enrichmentCompletenessLabel}:{" "}
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
        <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
          <PublicReviewChannelCard source="Trustpilot" channel={normalized.reputation.trustpilot} />
          <PublicReviewChannelCard
            source="Google Reviews"
            channel={normalized.reputation.google}
            matchNote={normalized.reputation.googleMatchNote}
          />
        </div>

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
                  <p className="text-xs font-semibold text-slate-800">{labelForEvidenceTier(tier, flow)}</p>
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
                  <p className="text-xs font-semibold text-slate-800">{labelForEvidenceTier(tier, flow)}</p>
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
                <p className="text-sm font-semibold text-slate-900">{flow.scanResult.resultSections.optionalEvidenceHeading}</p>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600">
                  {flow.scanResult.resultSections.optionalEvidenceBody}
                </p>
              </div>
              {result.trustEvidence.screenshotAd ? <EvidenceSignalsCard section={result.trustEvidence.screenshotAd} /> : null}
              {result.trustEvidence.webshop ? <EvidenceSignalsCard section={result.trustEvidence.webshop} /> : null}
              {result.trustEvidence.socialAd ? <EvidenceSignalsCard section={result.trustEvidence.socialAd} /> : null}
            </div>
          ) : null}

          {result.siteStatus === "inactive" ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-800">
              <p className="font-semibold text-slate-900">{flow.specialOutcomes.inactive.headline}</p>
              <p className="mt-2 leading-relaxed">{flow.specialOutcomes.inactive.explain}</p>
              <p className="mt-2 text-xs text-slate-600">{flow.specialOutcomes.inactive.crawlNote}</p>
            </div>
          ) : null}

          {result.domainInfrastructure.treatAsNonExistentHost ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-950">
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-rose-800/90">
                    {flow.domainInfrastructure.domainStatusHeading}
                  </dt>
                  <dd className="mt-1 text-base font-semibold">{flow.domainInfrastructure.notRegisteredLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-rose-800/90">
                    {flow.domainInfrastructure.riskLevelHeading}
                  </dt>
                  <dd className="mt-1 text-base font-semibold">{flow.domainInfrastructure.highRiskInvalidLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-rose-800/90">
                    {flow.domainInfrastructure.reasonHeading}
                  </dt>
                  <dd className="mt-1 leading-relaxed text-rose-950/95">
                    {flow.domainInfrastructure.invalidHostExplanation}
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
        {flow.scanResult.footerDisclaimer}
      </div>
    </div>
  );
}
