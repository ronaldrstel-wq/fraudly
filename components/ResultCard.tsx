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
import { EN_MESSAGES } from "@/lib/messages.en";
import { shouldShowTrustGauge } from "@/lib/trustGaugeDisplay";
import { trustLevelFromScore, type TrustLevel } from "@/lib/trustSystem";
import { EvidenceSignalsCard } from "@/components/EvidenceSignalsCard";
import type { ScamCheckResult } from "@/types/scam";
import type { ConfidenceLevel, SiteStatus } from "@/types/site-outcome";
import type { ReputationEnrichment } from "@/lib/outscraper/reputation";

interface ResultCardProps {
  result: ScamCheckResult;
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
  if (trustLevel === "trusted" || trustLevel === "likelyLegit") return EN_MESSAGES.scanResult.consumerSummary.positive;
  if (trustLevel === "limitedEvidence" || trustLevel === "suspicious") return EN_MESSAGES.scanResult.consumerSummary.mixed;
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
  if (score >= 70) {
    return {
      track: "bg-emerald-100",
      fill: "bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-500",
      marker: "text-emerald-900"
    };
  }
  if (score >= 20) {
    return {
      track: "bg-amber-100",
      fill: "bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500",
      marker: "text-amber-900"
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

/** Tier‑1 phishing/malware list matches surfaced as structured provider rows (not guesses). */
function isConfirmedIntelTrustSignal(signal: TrustSignal): boolean {
  if (signal.type !== "danger" && signal.type !== "warning") return false;
  const blob = `${signal.title}\n${signal.description}\n${signal.source ?? ""}`.toLowerCase();
  return /safe browsing|openphish|urlhaus|politie|\bpolice\b/.test(blob);
}

export function ResultCard({ result }: ResultCardProps) {
  const threat = assessCriticalThreat(result);
  const displayTrust = displayTrustScoreForResult(result);
  const showGauge = shouldShowTrustGauge(result) && typeof displayTrust === "number";
  const showNonexistentHeadline = result.omitTrustScoreGauge === true;

  const trustLevel = trustLevelFromScore(displayTrust ?? 0);
  const humanKind = resolveHumanRecKind({
    threatActive: threat.active,
    threatKind: threat.kind,
    siteStatus: result.siteStatus,
    trustLevel
  });
  const humanHeadline = humanRecHeadline(humanKind);
  const humanTone = humanRecHeadlineTone(humanKind);
  const techStatus = technicalStatusText({
    threatActive: threat.active,
    threatKind: threat.kind,
    displayTrust,
    siteStatus: result.siteStatus
  });
  const shortExplain = shortScanExplanation({
    threatActive: threat.active,
    threatKind: threat.kind,
    siteStatus: result.siteStatus,
    trustLevel,
    confidenceLevel: result.confidenceLevel
  });
  const showLimitedStrip = shouldShowLimitedPublicStrip({
    threatActive: threat.active,
    confidenceLevel: result.confidenceLevel,
    trustLevel,
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
  const [reputation, setReputation] = useState<ReputationEnrichment | null>(null);
  const [repLoading, setRepLoading] = useState(false);
  const [repError, setRepError] = useState<string | null>(null);

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

  async function loadReputationSignals(deepScan: boolean) {
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
          deepScan
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
            deepScan: false
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
  }, [result.domain, result.score]);

  const meter = trustMeterTone(displayTrust ?? 0, threat.active);

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
            </header>

            <div className="max-w-2xl rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm sm:px-5 sm:py-4">
              <p className="text-sm leading-relaxed text-slate-800 sm:text-[15px] sm:leading-relaxed">
                {consumerSummaryFor(trustLevel, threat.active)}
              </p>
              <p className="mt-2 border-t border-slate-100 pt-2 text-xs leading-relaxed text-slate-500">
                {EN_MESSAGES.scanResult.consumerSummaryDisclaimer}
              </p>
            </div>

            <section
              className="rounded-xl border border-slate-200 bg-slate-50/75 px-4 py-3"
              aria-label={`${EN_MESSAGES.scanResult.technicalStatusHeading}: ${techStatus}`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {EN_MESSAGES.scanResult.technicalStatusHeading}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{techStatus}</p>
            </section>

            {showGauge && typeof displayTrust === "number" ? (
              <section className="rounded-xl border border-slate-200 bg-white px-4 py-3" aria-label={`Trust score ${displayTrust} out of 100`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {EN_MESSAGES.scanResult.trustScoreLabel}
                </p>
                <p className="mt-1.5 text-lg font-semibold tabular-nums">
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
                  <div className={`mt-1.5 grid grid-cols-3 text-[11px] font-medium ${meter.marker}`}>
                    <span className="text-left">Trusted</span>
                    <span className="text-center">Caution</span>
                    <span className="text-right">High Risk</span>
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

            <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {EN_MESSAGES.siteOutcome.scanCoverageHeading}
              </p>
              <p className="mt-1 font-semibold capitalize text-slate-900">{result.confidenceLevel}</p>
              <p className="mt-1 text-xs text-slate-600">{EN_MESSAGES.siteOutcome.scanCoverageHelper}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{labelForScanCoverage(result.confidenceLevel)}</p>
              {!threat.active ? <p className="mt-2 text-xs text-slate-600">{result.confidenceRationale}</p> : null}
              {threat.active ? (
                <p className="mt-2 text-xs font-medium text-rose-900">
                  {EN_MESSAGES.scanResult.resultSections.trustScoreThreatNote}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:max-w-md sm:items-end sm:text-right">
            <div className="text-sm text-slate-600 sm:text-right">
              <p className="font-medium text-slate-900">{EN_MESSAGES.scanResult.resultSections.analyzedDomainHeading}</p>
              <p className="mt-1 break-all">{result.domain}</p>
            </div>
          </div>
        </div>
      </div>

      {result.trustEvidence ? (
        <div className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{EN_MESSAGES.scanResult.resultSections.optionalEvidenceHeading}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
              {EN_MESSAGES.scanResult.resultSections.optionalEvidenceBody}
            </p>
          </div>
          {result.trustEvidence.screenshotAd ? <EvidenceSignalsCard section={result.trustEvidence.screenshotAd} /> : null}
          {result.trustEvidence.webshop ? <EvidenceSignalsCard section={result.trustEvidence.webshop} /> : null}
          {result.trustEvidence.socialAd ? <EvidenceSignalsCard section={result.trustEvidence.socialAd} /> : null}
        </div>
      ) : null}

      {result.siteStatus === "inactive" ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-800">
          <p className="font-semibold text-slate-900">{EN_MESSAGES.specialOutcomes.inactive.headline}</p>
          <p className="mt-2 leading-relaxed">{EN_MESSAGES.specialOutcomes.inactive.explain}</p>
          <p className="mt-2 text-xs text-slate-600">{EN_MESSAGES.specialOutcomes.inactive.crawlNote}</p>
        </div>
      ) : null}

      {result.domainInfrastructure.treatAsNonExistentHost ? (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-950">
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

      <details className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-5">
        <summary className="cursor-pointer list-none py-1 [&::-webkit-details-marker]:hidden">
          <span className="block text-base font-semibold text-slate-900">{EN_MESSAGES.scanResult.detailedFindingsToggle}</span>
          <span className="mt-1 block max-w-prose text-pretty text-xs font-normal leading-relaxed text-slate-500">
            {EN_MESSAGES.scanResult.detailedFindingsHint}
          </span>
        </summary>
        <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
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
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-700">
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
        </ul>
        <p className="mt-2 text-xs text-slate-500">Source: {result.domainIntelligence.source}</p>
      </div>

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
        </div>
      </details>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">{sec.aiFactorsHeading}</p>
        <p className="mt-1 max-w-prose text-pretty text-xs leading-relaxed text-slate-500">{sec.aiFactorsHint}</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          {result.reasons.map((reason, index) => (
            <li key={`${index}-${reason.slice(0, 48)}`}>{reason}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">AI model used in this run: {result.aiUsed ? "yes" : "no"}</p>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs leading-relaxed text-slate-600">
        {EN_MESSAGES.scanResult.footerDisclaimer}
      </div>
    </div>
  );
}
