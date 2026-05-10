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
import {
  assessCriticalThreat,
  criticalThreatBannerTitle,
  criticalThreatStatusHeadline,
  displayTrustScoreForResult,
  primaryCriticalThreatReason
} from "@/lib/scanPresentation";
import { EN_MESSAGES } from "@/lib/messages.en";
import { shouldShowTrustGauge } from "@/lib/trustGaugeDisplay";
import { trustIconGlyph, trustPresentationFromScore } from "@/lib/trustSystem";
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
  switch (tier) {
    case "confirmed_malicious":
      return "Confirmed malicious evidence";
    case "positive_trust":
      return "Positive trust evidence";
    case "neutral_observation":
      return "Neutral technical observations";
    case "risk_indicator":
      return "Risk indicators";
    case "missing_data":
      return "Limited evidence / source unavailable";
  }
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

function labelForConfidence(level: ConfidenceLevel): string {
  switch (level) {
    case "high":
      return EN_MESSAGES.siteOutcome.confidenceHighLabel;
    case "medium":
      return EN_MESSAGES.siteOutcome.confidenceMediumLabel;
    case "low":
      return EN_MESSAGES.siteOutcome.confidenceLowLabel;
  }
}

function siteStatusLabel(status: SiteStatus): string {
  switch (status) {
    case "trusted":
      return EN_MESSAGES.siteOutcome.trusted;
    case "unverified":
      return EN_MESSAGES.siteOutcome.unverified;
    case "caution":
      return EN_MESSAGES.siteOutcome.caution;
    case "high_risk":
      return EN_MESSAGES.siteOutcome.highRisk;
    case "confirmed_malicious":
      return EN_MESSAGES.siteOutcome.confirmedMalicious;
    case "nonexistent":
      return EN_MESSAGES.siteOutcome.nonexistent;
    case "inactive":
      return EN_MESSAGES.siteOutcome.inactive;
  }
}

/** Tier‑1 phishing/malware list matches surfaced as structured provider rows (not guesses). */
function isConfirmedIntelTrustSignal(signal: TrustSignal): boolean {
  if (signal.type !== "danger" && signal.type !== "warning") return false;
  const blob = `${signal.title}\n${signal.description}\n${signal.source ?? ""}`.toLowerCase();
  return /safe browsing|openphish|urlhaus|politie|\bpolice\b/.test(blob);
}

function footerFromSiteStatus(status: SiteStatus): { card: string; body: string } {
  switch (status) {
    case "trusted":
      return {
        card: "border-emerald-200 bg-emerald-50 text-emerald-950",
        body: "Anchors look supportive for this snapshot—still verify payments and identities through normal diligence."
      };
    case "unverified":
      return {
        card: "border-slate-200 bg-slate-50 text-slate-900",
        body: "Fraudly could not corroborate a strong public stewardship story. Low visibility is not proof of fraud—take extra verification steps."
      };
    case "caution":
      return {
        card: "border-amber-200 bg-amber-50 text-amber-950",
        body: "Some warnings were found. Verify payment safety and seller legitimacy before buying."
      };
    case "high_risk":
      return {
        card: "border-rose-200 bg-rose-50 text-rose-950",
        body: "Several structural or behavioural red flags showed up in this snapshot. Unless a feed confirmed a threat, this is not the same as a proven scam—still verify before paying or sharing sensitive data."
      };
    case "confirmed_malicious":
      return {
        card: "border-rose-300 bg-rose-100 text-rose-950",
        body: "At least one authoritative feed or police‑aligned reference lists this host. Treat it as malicious until an independent official source contradicts that."
      };
    case "nonexistent":
      return {
        card: "border-rose-200 bg-rose-50 text-rose-950",
        body: "This hostname is being treated as invalid or unverifiable—not as a safe or trusted website."
      };
    case "inactive":
      return {
        card: "border-slate-200 bg-slate-50 text-slate-900",
        body: "The domain may exist, but no usable public website was observed here. That is common for parked names; it is not, by itself, proof of a scam."
      };
  }
}

export function ResultCard({ result }: ResultCardProps) {
  const threat = assessCriticalThreat(result);
  const displayTrust = displayTrustScoreForResult(result);
  const showGauge = shouldShowTrustGauge(result) && typeof displayTrust === "number";
  const showNonexistentHeadline = result.omitTrustScoreGauge === true;
  const bandStyle = trustPresentationFromScore(displayTrust ?? 0);
  const style = threat.active
    ? {
        ...bandStyle,
        toneText: "text-rose-950",
        toneSoftBg: "bg-rose-100",
        toneSoftBorder: "border-rose-400",
        progressBar: "bg-rose-600",
        label: criticalThreatStatusHeadline(threat.kind),
        icon: "risk" as const
      }
    : bandStyle;

  const threatStatusTitle = threat.active ? criticalThreatStatusHeadline(threat.kind) : siteStatusLabel(result.siteStatus);
  const keyReasonText = threat.active
    ? primaryCriticalThreatReason(result)
    : (result.reasons[0] ?? "See the detailed sections below for what we observed.");

  const { reviewSignals } = result;
  const hasPublicReviewData = reviewSignals.trustpilotFound || reviewSignals.googleFound;
  const scoreTierBuckets = tierScoreSignals(result.scoreResult.signals);
  const intelTierBuckets = tierIntel(result.intelScoreBreakdown);

  const keyRisks = result.trustSignals.filter((s) => s.type === "danger" || s.type === "warning");
  const confirmedMaliciousSignals = keyRisks.filter(isConfirmedIntelTrustSignal);
  const otherRiskSignals = keyRisks.filter((s) => !isConfirmedIntelTrustSignal(s));
  const supportiveSignals = result.trustSignals.filter((s) => s.type === "positive" || s.type === "info");
  const footer = footerFromSiteStatus(result.siteStatus);
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

  return (
    <div className="w-full rounded-xl bg-white p-6 shadow-lg shadow-slate-200/60 transition-all duration-300">
      {threat.active ? (
        <div
          className="mb-6 rounded-xl border-2 border-rose-600 bg-rose-50 px-4 py-4 shadow-sm ring-1 ring-rose-200/80"
          role="alert"
        >
          <p className="text-xl font-bold tracking-tight text-rose-950">{criticalThreatBannerTitle(threat.kind)}</p>
          <p className="mt-2 text-sm font-medium leading-relaxed text-rose-950">{EN_MESSAGES.threatOverride.bannerBody}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-6">
        <div className="min-w-0 flex-1 space-y-5">
          <header>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{EN_MESSAGES.siteOutcome.statusHeading}</p>
            <p
              className={`mt-1 text-2xl font-bold tracking-tight ${threat.active ? "text-rose-900" : "text-slate-900"}`}
            >
              {threatStatusTitle}
            </p>
          </header>

          {showGauge && typeof displayTrust === "number" ? (
            <>
              <section aria-label={`Trust score ${displayTrust} out of 100`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trust score</p>
                <div className="mt-2 flex min-w-0 flex-wrap items-center gap-4">
                  <div
                    className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-8 border-white text-2xl font-bold shadow-sm ${style.toneSoftBg} ${style.toneText}`}
                  >
                    {displayTrust}%
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm font-semibold ${style.toneSoftBorder} ${style.toneSoftBg} ${style.toneText}`}
                    >
                      <span aria-hidden>{trustIconGlyph(style.icon)}</span>
                      {style.label}
                    </p>
                    {!threat.active ? (
                      <p className="mt-1 text-sm text-slate-600">{EN_MESSAGES.scanResult.trustScoreExplainer}</p>
                    ) : (
                      <p className="mt-1 text-sm font-medium text-rose-900">
                        Intelligence feeds override the usual score band—treat this host as dangerous.
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full ${style.progressBar}`} style={{ width: `${displayTrust}%` }} />
                </div>
              </section>
            </>
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

          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {EN_MESSAGES.scanResult.keyReasonHeading}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-800">{keyReasonText}</p>
          </section>

          <div className="rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {EN_MESSAGES.siteOutcome.confidenceHeading}
            </p>
            <p className="mt-1 font-semibold capitalize text-slate-900">{result.confidenceLevel}</p>
            <p className="mt-1 text-xs text-slate-600">{EN_MESSAGES.siteOutcome.confidenceHelper}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{labelForConfidence(result.confidenceLevel)}</p>
            {!threat.active ? <p className="mt-2 text-xs text-slate-600">{result.confidenceRationale}</p> : null}
            {threat.active ? (
              <p className="mt-2 text-xs font-medium text-rose-900">
                Feed matches are decisive; evidence strength describes how much extra context we gathered, not whether the threat is real.
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:max-w-md sm:items-end sm:text-right">
          <div className="text-sm text-slate-600 sm:text-right">
            <p className="font-medium text-slate-900">Analyzed domain</p>
            <p className="mt-1 break-all">{result.domain}</p>
          </div>
        </div>
      </div>

      {result.trustEvidence ? (
        <div className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Optional evidence analysis</h2>
            <p className="mt-1 text-sm text-slate-600">
              You added optional context (screenshot, ad text, or source). We combined it with the website scan—this
              does not replace technical checks.
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

      <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Confirmed malicious intelligence</p>
        <p className="mt-1 text-xs text-slate-500">Structured matches from phishing/malware lists or police-aligned references only.</p>
        <SignalList
          signals={confirmedMaliciousSignals}
          empty="No Safe Browsing, OpenPhish, URLhaus, or police-aligned list matches were returned in this crawl."
        />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Other risk indicators</p>
        <p className="mt-1 text-xs text-slate-500">Higher-severity heuristics and technical warnings that still require independent verification.</p>
        <SignalList
          signals={otherRiskSignals}
          empty="No additional prioritized risk rows were raised beyond curated list matches."
        />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Trust anchors & neutral observations</p>
        <p className="mt-1 text-xs text-slate-500">
          Supportive facts and neutral technical notes. Absences (for example missing reviews or “no feed hit”) limit confidence—they are
          not proof a site is safe.
        </p>
        <SignalList signals={supportiveSignals} empty="No supportive or informational trust rows were returned." />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Domain information</p>
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

      <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Security checks</p>
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

      <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Intelligence sources</p>
        <p className="mt-1 text-xs text-slate-500">
          Normalized provider output. “Matched” means the provider reported a hit or pattern in this run.
        </p>
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
                  Source: {row.source} · severity: {row.severity} · confidence: {row.confidence}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Public reputation signals</p>
        <p className="mt-1 text-xs text-slate-500">
          Cached / Outscraper-backed enrichment when it runs—broader than the quick baseline probes below.
        </p>
        {repLoading ? (
          <p className="mt-2 text-sm text-slate-600">Checking public-source signals...</p>
        ) : repError ? (
          <p className="mt-2 text-sm text-slate-600">
            Public-source enrichment is currently unavailable. Base scan signals are still shown.
          </p>
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
                  Confidence: <span className="font-medium">{reputation.publicSignals.confidence}</span>
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
          <p className="mt-2 text-sm text-slate-600">
            No public reputation profile found. This does not automatically mean unsafe.
          </p>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Baseline review signals (main scan)</p>
        <p className="mt-1 text-xs text-slate-500">
          Lightweight directory probes for the numeric model. Crawler or feed hiccups here describe Fraudly’s snapshot—not the merchant’s honesty.
        </p>
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

      <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Supply chain</p>
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

      <details className="mt-6 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm">
        <summary className="cursor-pointer font-semibold text-slate-900">Score evidence (debug)</summary>
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

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
          Combined scoring signals (reviews, domain literacy, Tier‑1 intel, supply chain…)
        </p>
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

        <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-600">Tier‑1 intelligence weighting only</p>
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

        <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-600">Baseline review probes (debug)</p>
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

      <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">AI summary & key factors</p>
        <p className="mt-1 text-xs text-slate-500">
          Blended automated notes (heuristics, intel-weighted scoring context, and optional AI). This is not legal or
          financial advice.
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          {result.reasons.map((reason, index) => (
            <li key={`${index}-${reason.slice(0, 48)}`}>{reason}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">AI model used in this run: {result.aiUsed ? "yes" : "no"}</p>
      </div>

      <div className={`mt-6 rounded-xl border px-4 py-3 text-sm ${footer.card}`}>{footer.body}</div>
    </div>
  );
}
