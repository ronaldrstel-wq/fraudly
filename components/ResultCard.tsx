"use client";

import { useEffect, useState } from "react";
import { ReviewSummary } from "@/components/ReviewSummary";
import type { TrustSignal } from "@/lib/checks/types";
import { trustIconGlyph, trustPresentationFromScore } from "@/lib/trustSystem";
import type { ScamCheckResult } from "@/types/scam";
import type { ReputationEnrichment } from "@/lib/outscraper/reputation";

interface ResultCardProps {
  result: ScamCheckResult;
}

export function getScoreUiModel(scoreResult: ScamCheckResult["scoreResult"] | undefined) {
  return {
    confidence: scoreResult?.confidence ?? "low",
    riskLabels: Array.isArray(scoreResult?.riskLabels) ? scoreResult.riskLabels : [],
    riskLabelDetails: Array.isArray(scoreResult?.riskLabelDetails) ? scoreResult.riskLabelDetails : [],
    scoreBreakdown: scoreResult?.scoreBreakdown,
    scoreCapsApplied: Array.isArray(scoreResult?.scoreCapsApplied) ? scoreResult.scoreCapsApplied : [],
    userExplanation: scoreResult?.userExplanation
  };
}

export function simplifyTechnicalText(input: string): string {
  return input
    .replace(/Valid TLS certificate detected/gi, "The website uses encrypted HTTPS connections.")
    .replace(/No OpenPhish feed match/gi, "We found no known phishing reports for this website.")
    .replace(/Google Safe Browsing not configured/gi, "Some external security checks were unavailable during this scan.")
    .replace(/No matched Google listing/gi, "There is limited established public reputation data for this website.")
    .replace(/No data found/gi, "Some scan data was unavailable during this check.")
    .trim();
}

export function isTechnicalDetailsCollapsedByDefault(): boolean {
  return true;
}

export function buildConsumerSummary(result: ScamCheckResult): {
  why: string[];
  recommendation: string;
} {
  const reasons = (result.scoreResult?.userExplanation?.mainReasons ?? result.reasons)
    .map((r) => simplifyTechnicalText(r))
    .filter(Boolean)
    .slice(0, 4);
  const recommendation =
    result.scoreResult?.userExplanation?.recommendation ??
    "Use buyer protection and verify company details before making larger purchases.";
  return { why: reasons, recommendation: simplifyTechnicalText(recommendation) };
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
          <p className="font-semibold">{simplifyTechnicalText(signal.title)}</p>
          <p className="mt-0.5">{simplifyTechnicalText(signal.description)}</p>
          <div className="mt-1 flex flex-wrap gap-x-2 text-xs opacity-80">
            {signal.source ? <span>Source: {signal.source}</span> : null}
            {signal.confidence ? <span>Confidence: {signal.confidence}</span> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function isUnavailableSignal(signal: TrustSignal): boolean {
  const text = `${signal.title} ${signal.description}`.toLowerCase();
  return /unavailable|not configured|timed out|timeout|failed|skipped|no data|not available/.test(text);
}

export function splitSignalsForDisplay(signals: TrustSignal[]) {
  const unavailable = signals.filter((s) => isUnavailableSignal(s));
  const positives = signals.filter((s) => s.type === "positive" && !isUnavailableSignal(s));
  const concerns = signals.filter((s) => (s.type === "danger" || s.type === "warning") && !isUnavailableSignal(s));
  const neutral = signals.filter((s) => s.type === "info" && !isUnavailableSignal(s));
  return { unavailable, positives, concerns, neutral };
}

export function shouldAutoTriggerDeepScan(result: ScamCheckResult): boolean {
  const score = result.score;
  const hasRiskLabel =
    result.scoreResult?.riskLabels?.some((label) =>
      [
        "Possible dropshipping store",
        "Possible rebrand",
        "Possible rebrand network",
        "High complaint volume",
        "Return policy risk",
        "Brand location mismatch",
        "Missing company identity"
      ].includes(label)
    ) ?? false;
  const hasHighRiskSignal = result.trustSignals.some((s) => s.type === "danger");
  const hasEcomRisk = result.supplyChainSignals.likelyDropshipping || result.supplyChainSignals.likelyChinaShipping;
  return score >= 35 || hasRiskLabel || hasHighRiskSignal || hasEcomRisk;
}

function concernsFromRiskLabels(labels: string[], domainAgeDays?: number | null): string[] {
  const concerns: string[] = [];
  if (typeof domainAgeDays === "number" && domainAgeDays <= 30) concerns.push("The website appears very new.");
  const labelMap: Record<string, string> = {
    "Possible dropshipping store": "Possible dropshipping indicators were detected.",
    "High complaint volume": "Customer complaint volume appears elevated.",
    "Refund/shipping complaints": "Refund or shipping complaints were found.",
    "Missing company identity": "Company identity information is limited.",
    "Brand location mismatch": "Brand/location claims may not match operational signals.",
    "Possible rebrand": "Possible rebrand indicators were found.",
    "Possible rebrand network": "Possible rebrand-network overlap was detected.",
    "Return policy risk": "Return policy terms may be difficult for customers.",
    "Supplier product images detected": "Product images appear similar to supplier marketplace listings."
  };
  for (const label of labels) {
    const mapped = labelMap[label];
    if (mapped) concerns.push(mapped);
  }
  return [...new Set(concerns)].slice(0, 6);
}

function positiveSummarySignals(result: ScamCheckResult, supportiveSignals: TrustSignal[]): string[] {
  const positives: string[] = [];
  if (result.ssl.httpsEnabled) positives.push("The website uses encrypted HTTPS connections.");
  if (result.scoreResult?.companyIdentitySignals?.positiveSignals?.length) positives.push("Some business identity details are consistent.");
  if ((result.reviewSignals.googleFound && (result.reviewSignals.googleReviewCount ?? 0) > 50) || (result.reviewSignals.trustpilotFound && (result.reviewSignals.trustpilotReviewCount ?? 0) > 50)) {
    positives.push("Established public review history is available.");
  }
  if (typeof result.domainIntelligence.ageDays === "number" && result.domainIntelligence.ageDays > 365) positives.push("The domain has been active for a longer period.");
  positives.push(...supportiveSignals.map((s) => simplifyTechnicalText(s.description)).slice(0, 2));
  return [...new Set(positives)].slice(0, 5);
}

export function ResultCard({ result }: ResultCardProps) {
  const trustScore = Math.round(100 - result.score);
  const style = trustPresentationFromScore(trustScore);
  const { reviewSignals } = result;
  const hasPublicReviewData = reviewSignals.trustpilotFound || reviewSignals.googleFound;

  const splitSignals = splitSignalsForDisplay(result.trustSignals);
  const keyRisks = splitSignals.concerns;
  const unavailableSignals = splitSignals.unavailable;
  const supportiveSignals = splitSignals.positives;
  const neutralSignals = splitSignals.neutral;
  const [reputation, setReputation] = useState<ReputationEnrichment | null>(null);
  const [repLoading, setRepLoading] = useState(false);
  const [repError, setRepError] = useState<string | null>(null);
  const scoreUi = getScoreUiModel(result.scoreResult);
  const scoreConfidence = scoreUi.confidence;
  const riskLabels = scoreUi.riskLabels;
  const consumerSummary = buildConsumerSummary(result);
  const keyConcerns = concernsFromRiskLabels(riskLabels, result.domainIntelligence.ageDays ?? null);
  const relatedDomains = Array.isArray(result.scoreResult?.relatedDomains) ? result.scoreResult.relatedDomains : [];
  const rebrandNetwork = result.scoreResult?.rebrandNetworkSignals;
  const companyIdentity = result.scoreResult?.companyIdentitySignals;
  const outscraper = result.scoreResult?.outscraperReputation;
  const productMarketplace = result.scoreResult?.productMarketplaceSignals;
  const autoDeepScan = shouldAutoTriggerDeepScan(result);
  const positiveSignalsSummary = positiveSummarySignals(result, supportiveSignals);
  const usedSources = Array.from(
    new Set(
      [
        ...(result.scoreResult?.signalSources ?? []),
        ...result.trustSignals
          .map((s) => s.source?.trim())
          .filter((v): v is string => Boolean(v))
      ].filter((v): v is string => Boolean(v))
    )
  ).slice(0, 8);

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
            deepScan: autoDeepScan
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
  }, [result.domain, result.score, autoDeepScan]);

  return (
    <div className="w-full rounded-xl bg-white p-6 shadow-lg shadow-slate-200/60 transition-all duration-300">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 items-center gap-4" aria-label={`Trust score ${trustScore} percent, ${style.label}`}>
          <div
            className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-8 border-white text-2xl font-bold shadow-sm ${style.toneSoftBg} ${style.toneText}`}
          >
            {trustScore}%
          </div>
          <div className="min-w-0">
            <p
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm font-semibold ${style.toneSoftBorder} ${style.toneSoftBg} ${style.toneText}`}
            >
              <span aria-hidden>{trustIconGlyph(style.icon)}</span>
              {style.label}
            </p>
            <p className="mt-1 text-sm text-slate-500">Trust score (automated)</p>
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:max-w-md sm:items-end sm:text-right">
          <div className="text-sm text-slate-600 sm:text-right">
            <p className="font-medium text-slate-900">Analyzed domain</p>
            <p className="mt-1 break-all">{result.domain}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${style.progressBar}`} style={{ width: `${trustScore}%` }} />
      </div>

      <div className={`mt-6 rounded-xl border px-4 py-4 ${style.toneSoftBorder} ${style.toneSoftBg}`}>
        <p className={`text-sm font-bold ${style.toneText}`}>{style.label}</p>
        <p className="mt-1 text-sm text-slate-700">
          Trust score: <span className="font-semibold">{trustScore}%</span> · Confidence: <span className="font-semibold capitalize">{scoreConfidence}</span>
        </p>
        <p className="mt-3 text-sm font-semibold text-slate-900">Why this score</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {consumerSummary.why.length > 0 ? (
            consumerSummary.why.map((item, idx) => <li key={`${idx}-${item.slice(0, 30)}`}>{item}</li>)
          ) : (
            <li>We found mixed signals and adjusted risk conservatively.</li>
          )}
        </ul>
        <p className="mt-3 text-sm font-semibold text-slate-900">Recommendation</p>
        <p className="mt-1 text-sm text-slate-700">{consumerSummary.recommendation}</p>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Key concerns</p>
        <p className="mt-1 text-xs text-slate-500">Main risk points for normal shoppers.</p>
        {keyConcerns.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {keyConcerns.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <div className="mt-2">
            <SignalList
              signals={keyRisks}
              empty="No major customer-facing concerns were detected."
            />
          </div>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Positive signs</p>
        <p className="mt-1 text-xs text-slate-500">Meaningful signs that support trust.</p>
        {positiveSignalsSummary.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {positiveSignalsSummary.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-600">No strong positive trust signals were confirmed.</p>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Unavailable or incomplete checks</p>
        <p className="mt-1 text-xs text-slate-500">These checks were unavailable or incomplete during this run.</p>
        <SignalList signals={unavailableSignals} empty="No unavailable checks reported." />
      </div>

      <details className="mt-6 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm">
        <summary className="cursor-pointer font-semibold text-slate-900">Show technical details</summary>
        <p className="mt-1 text-xs text-slate-500">Advanced technical transparency for power users.</p>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Additional technical context</p>
        <SignalList signals={neutralSignals} empty="No extra technical context rows were returned." />
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
        {typeof result.domainIntelligence.ageDays === "number" && result.domainIntelligence.ageDays <= 7 ? (
          <p className="mt-2 inline-flex rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800">
            Extremely new domain ({result.domainIntelligence.ageDays} days old)
          </p>
        ) : null}
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

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Review signals</p>
        {hasPublicReviewData ? (
          <div className="mt-2 space-y-2 text-sm text-slate-700">
            {reviewSignals.googleFound && (
              <div>
                <p className="font-medium text-slate-900">Google</p>
                <p>
                  Rating:{" "}
                  <span className="font-medium">{reviewSignals.googleRating?.toFixed(1) ?? "n/a"}</span>
                </p>
                <p>
                  Review count: <span className="font-medium">{reviewSignals.googleReviewCount ?? "n/a"}</span>
                </p>
              </div>
            )}
            {reviewSignals.trustpilotFound && (
              <div>
                <p className="font-medium text-slate-900">Trustpilot</p>
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
          <p className="mt-2 text-sm text-slate-600">No public review data found yet.</p>
        )}

        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {reviewSignals.suspiciousReviewSignals.map((signal, index) => (
            <li key={`${index}-${signal.slice(0, 40)}`}>{signal}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-500">{result.reviewSummary}</p>
        {reviewSignals.sources.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">Sources: {reviewSignals.sources.join(", ")}</p>
        )}
        {reviewSignals.warnings.length > 0 && (
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-amber-800">
            {reviewSignals.warnings.map((w, i) => (
              <li key={`${i}-${w.slice(0, 40)}`}>{w}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Review Summary</p>
        {repLoading ? (
          <p className="mt-2 text-sm text-slate-600">Checking external review signals...</p>
        ) : repError ? (
          <p className="mt-2 text-sm text-slate-600">
            No external reputation profile found. This does not automatically mean unsafe.
          </p>
        ) : reputation ? (
          <div className="mt-2 space-y-2 text-sm text-slate-700">
            <ReviewSummary enrichment={reputation} />
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
            No external reputation profile found. This does not automatically mean unsafe.
          </p>
        )}
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
          Signed contributions toward the server risk score (positive numbers increase risk, negative numbers reduce it).
        </p>
        {result.intelScoreBreakdown.length === 0 ? (
          <p className="mt-2 text-xs text-slate-600">No weighted intel contributions in this run.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-xs text-slate-700">
            {result.intelScoreBreakdown.map((row) => (
              <li key={row.id}>
                <span className="font-medium">{row.label}</span> ({row.impact >= 0 ? "+" : ""}
                {row.impact}) — {row.rationale}
                {row.source ? <span className="text-slate-500"> · {row.source}</span> : null}
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

      <div className={`mt-6 rounded-xl border px-4 py-3 text-sm ${style.toneSoftBorder} ${style.toneSoftBg} ${style.toneText}`}>
        {style.level === "trusted"
          ? "Signals are mostly supportive for this snapshot, but still use normal checkout caution."
          : style.level === "caution"
            ? "Some warnings were found. Verify payment safety and seller legitimacy before buying."
            : "Multiple risk indicators were detected. Avoid sharing personal or payment details until independently verified."}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Scoring transparency</p>
        <p className="mt-1 text-xs text-slate-600">
          Confidence level: <span className="font-medium">{scoreConfidence}</span>
        </p>
        {riskLabels.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {riskLabels.map((label) => (
              <span
                key={label}
                className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900"
              >
                {label}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">No major ecommerce risk labels were triggered in this run.</p>
        )}
        {usedSources.length > 0 ? (
          <p className="mt-3 text-xs text-slate-500">Signals used: {usedSources.join(", ")}</p>
        ) : (
          <p className="mt-3 text-xs text-slate-500">Signals used: internal heuristic scoring and provider checks.</p>
        )}
        {relatedDomains.length > 0 ? (
          <p className="mt-2 text-xs text-slate-500">Related domains: {relatedDomains.join(", ")}</p>
        ) : null}
        {rebrandNetwork ? (
          <div className="mt-3 space-y-1 text-xs text-slate-600">
            <p>
              Rebrand-network confidence: <span className="font-medium">{rebrandNetwork.confidence}</span>
            </p>
            {Array.isArray(rebrandNetwork.matchedSignals) && rebrandNetwork.matchedSignals.length > 0 ? (
              <p>Matched network signals: {rebrandNetwork.matchedSignals.slice(0, 6).join(" · ")}</p>
            ) : (
              <p>No strong rebrand-network overlap detected.</p>
            )}
          </div>
        ) : null}
        {companyIdentity ? (
          <div className="mt-3 space-y-1 text-xs text-slate-600">
            <p>
              Company identity confidence: <span className="font-medium">{companyIdentity.confidence}</span>
            </p>
            {companyIdentity.companyName ? <p>Company: {companyIdentity.companyName}</p> : null}
            {companyIdentity.legalEntityName ? <p>Legal entity: {companyIdentity.legalEntityName}</p> : null}
            {companyIdentity.claimedLocation ? <p>Claimed location: {companyIdentity.claimedLocation}</p> : null}
            {companyIdentity.legalAddress ? <p>Legal address: {companyIdentity.legalAddress}</p> : null}
            {companyIdentity.returnAddress ? <p>Return address: {companyIdentity.returnAddress}</p> : null}
            {companyIdentity.supportEmail ? <p>Support email: {companyIdentity.supportEmail}</p> : null}
            {companyIdentity.phoneNumber ? <p>Phone: {companyIdentity.phoneNumber}</p> : null}
            {Array.isArray(companyIdentity.registrationNumbers) && companyIdentity.registrationNumbers.length > 0 ? (
              <p>Registration numbers: {companyIdentity.registrationNumbers.join(", ")}</p>
            ) : null}
            {Array.isArray(companyIdentity.mismatches) && companyIdentity.mismatches.length > 0 ? (
              <p>Mismatches: {companyIdentity.mismatches.slice(0, 4).join(" · ")}</p>
            ) : null}
          </div>
        ) : null}
        {scoreUi.userExplanation ? (
          <div className="mt-3 space-y-1 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">Why this score?</p>
            <p>{scoreUi.userExplanation.summary}</p>
            {scoreUi.userExplanation.mainReasons.length > 0 ? (
              <p>Main reasons: {scoreUi.userExplanation.mainReasons.join(" · ")}</p>
            ) : null}
            {scoreUi.userExplanation.cautionNotes.length > 0 ? (
              <p>Cautions: {scoreUi.userExplanation.cautionNotes.join(" · ")}</p>
            ) : null}
            <p>Recommendation: {scoreUi.userExplanation.recommendation}</p>
          </div>
        ) : null}
        {scoreUi.scoreCapsApplied.length > 0 ? (
          <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-900">
            <p className="font-semibold">Score caps applied</p>
            {scoreUi.scoreCapsApplied.map((cap) => (
              <p key={`${cap.cap}-${cap.reason}`}>Max {cap.cap}% trust: {cap.reason}</p>
            ))}
          </div>
        ) : null}
        {scoreUi.scoreBreakdown ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(
              [
                ["Technical safety", scoreUi.scoreBreakdown.technicalSafety],
                ["Merchant trust", scoreUi.scoreBreakdown.merchantTrust],
                ["Company identity", scoreUi.scoreBreakdown.companyIdentity],
                ["Policy / refund risk", scoreUi.scoreBreakdown.policyRisk],
                ["Reputation / reviews", scoreUi.scoreBreakdown.reputationReviews]
              ] as const
            ).map(([title, part]) => (
              <div key={title} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs">
                <p className="font-semibold text-slate-800">
                  {title}: {part.score}/100 ({part.label})
                </p>
                <p className="mt-0.5 text-slate-600">{part.explanation}</p>
              </div>
            ))}
          </div>
        ) : null}
        {scoreUi.riskLabelDetails.length > 0 ? (
          <div className="mt-3 space-y-1 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">Risk labels explained</p>
            {scoreUi.riskLabelDetails.map((item) => (
              <p key={`${item.label}-${item.explanation}`}>
                <span className="font-medium">{item.label}:</span> {item.explanation}
              </p>
            ))}
          </div>
        ) : null}
        {outscraper ? (
          <div className="mt-3 space-y-1 text-xs text-slate-600">
            <p>
              Outscraper source: <span className="font-medium">{outscraper.source}</span>
            </p>
            <p>
              Availability: <span className="font-medium">{outscraper.available ? "available" : "unavailable"}</span>
            </p>
            {outscraper.available ? (
              <>
                <p>
                  Rating / count:{" "}
                  <span className="font-medium">
                    {outscraper.rating ?? "n/a"} · {outscraper.reviewCount ?? "n/a"} reviews
                  </span>
                </p>
                <p>
                  Negative review ratio:{" "}
                  <span className="font-medium">
                    {outscraper.negativeReviewRatio == null ? "n/a" : `${Math.round(outscraper.negativeReviewRatio * 100)}%`}
                  </span>
                </p>
                <p>
                  Outscraper confidence: <span className="font-medium">{outscraper.confidence}</span>
                </p>
                {outscraper.strongestComplaintThemes.length > 0 ? (
                  <p>Complaint themes: {outscraper.strongestComplaintThemes.join(", ")}</p>
                ) : null}
              </>
            ) : (
              <p>Outscraper data was not available for this scan; scoring safely falls back to other signals.</p>
            )}
          </div>
        ) : null}
        {productMarketplace ? (
          <div className="mt-3 space-y-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">Product marketplace image matching</p>
            <p>
              Confidence: <span className="font-medium">{productMarketplace.confidence}</span>
            </p>
            <p>
              Matched images: <span className="font-medium">{productMarketplace.matchedImageCount}</span>
            </p>
            {productMarketplace.matchedMarketplaces.length > 0 ? (
              <p>Matched marketplaces: {productMarketplace.matchedMarketplaces.join(", ")}</p>
            ) : (
              <p>No strong marketplace image overlaps in this run.</p>
            )}
            {productMarketplace.matchedProducts.length > 0 ? (
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {productMarketplace.matchedProducts.slice(0, 4).map((row, idx) => (
                  <li key={`${idx}-${row.marketplace}-${row.similarityScore}`}>
                    {row.marketplace} match ({Math.round(row.similarityScore * 100)}% similarity)
                    {row.marketplaceProductTitle ? ` · ${row.marketplaceProductTitle}` : ""}
                  </li>
                ))}
              </ul>
            ) : null}
            {productMarketplace.riskSignals.length > 0 ? (
              <p>Why it mattered: {productMarketplace.riskSignals.slice(0, 2).join(" · ")}</p>
            ) : null}
            <p className="text-[11px] text-slate-500">
              This is contextual sourcing evidence, not automatic proof of fraud.
            </p>
          </div>
        ) : null}
      </div>
      </details>
    </div>
  );
}
