"use client";

import { useEffect, useState } from "react";
import { ReviewSummary } from "@/components/ReviewSummary";
import type { TrustSignal } from "@/lib/checks/types";
import type { ReputationEnrichment } from "@/lib/outscraper/reputation";
import { trustDisplayFromRiskScore } from "@/lib/trustDisplay";
import { trustIconGlyph } from "@/lib/trustSystem";
import type { ScamCheckResult } from "@/types/scam";

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
    .replace(/No matched Google listing/gi, "We could not confirm an established public review history.")
    .trim();
}

export function isTechnicalDetailsCollapsedByDefault(): boolean {
  return true;
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

export function buildConsumerSummary(result: ScamCheckResult): { why: string[]; recommendation: string } {
  const why = (result.scoreResult?.userExplanation?.mainReasons ?? result.reasons)
    .map((x) => simplifyTechnicalText(x))
    .filter(Boolean)
    .slice(0, 5);
  const recommendation =
    result.scoreResult?.userExplanation?.recommendation ??
    "Use buyer protection and avoid large purchases until the store builds a stronger reputation.";
  return { why, recommendation: simplifyTechnicalText(recommendation) };
}

export function shouldAutoTriggerDeepScan(result: ScamCheckResult): boolean {
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
  return result.score >= 35 || hasRiskLabel || result.supplyChainSignals.likelyDropshipping || result.supplyChainSignals.likelyChinaShipping;
}

function concernsFromRiskLabels(labels: string[], domainAgeDays?: number | null): string[] {
  const out: string[] = [];
  if (typeof domainAgeDays === "number" && domainAgeDays <= 30) out.push(`This website was registered only ${domainAgeDays} days ago.`);
  const labelMap: Record<string, string> = {
    "Possible dropshipping store": "Possible dropshipping patterns were detected.",
    "High complaint volume": "A high volume of customer complaints was found.",
    "Refund/shipping complaints": "Customers report refund or delivery problems.",
    "Missing company identity": "Company identity details appear incomplete.",
    "Inconsistent legal entity": "Company identity details appear inconsistent.",
    "Brand location mismatch": "Brand location claims may not match operating signals.",
    "Possible rebrand network": "Possible rebrand-network signals were detected.",
    "Return policy risk": "Return/refund policy terms may be difficult for customers.",
    "Supplier product images detected": "Product images appear similar to supplier marketplaces."
  };
  for (const label of labels) {
    if (labelMap[label]) out.push(labelMap[label]);
  }
  return [...new Set(out)].slice(0, 6);
}

function positiveSummarySignals(result: ScamCheckResult, supportiveSignals: TrustSignal[]): string[] {
  const out: string[] = [];
  if (result.ssl.httpsEnabled) out.push("HTTPS connection is active.");
  if ((result.reviewSignals.googleReviewCount ?? 0) >= 100 || (result.reviewSignals.trustpilotReviewCount ?? 0) >= 100) {
    out.push("Established review history is available.");
  }
  if ((result.domainIntelligence.ageDays ?? 0) > 365) out.push("The domain has a longer operating history.");
  if (result.scoreResult?.companyIdentitySignals?.positiveSignals?.length) out.push("Some company identity fields are consistent.");
  out.push(...supportiveSignals.map((s) => simplifyTechnicalText(s.description)).slice(0, 2));
  return [...new Set(out)].slice(0, 5);
}

function SignalList({ signals, empty }: { signals: TrustSignal[]; empty: string }) {
  if (signals.length === 0) return <p className="mt-2 text-sm text-slate-600">{empty}</p>;
  return (
    <ul className="mt-2 space-y-2">
      {signals.map((signal, index) => (
        <li key={`${index}-${signal.title}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
          <p className="font-semibold">{simplifyTechnicalText(signal.title)}</p>
          <p className="mt-0.5">{simplifyTechnicalText(signal.description)}</p>
        </li>
      ))}
    </ul>
  );
}

export function ResultCard({ result }: ResultCardProps) {
  const trust = trustDisplayFromRiskScore(result.score);
  const trustScore = trust.trustScore;
  const scoreUi = getScoreUiModel(result.scoreResult);
  const split = splitSignalsForDisplay(result.trustSignals);
  const consumer = buildConsumerSummary(result);
  const keyConcerns = concernsFromRiskLabels(scoreUi.riskLabels, result.domainIntelligence.ageDays ?? null);
  const positives = positiveSummarySignals(result, split.positives);
  const autoDeepScan = shouldAutoTriggerDeepScan(result);
  const [reputation, setReputation] = useState<ReputationEnrichment | null>(null);
  const [repLoading, setRepLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setRepLoading(true);
      try {
        const response = await fetch("/api/enrichment/reputation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ domain: result.domain, baseRiskScore: result.score, deepScan: autoDeepScan })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as { enrichment?: ReputationEnrichment };
        if (active) setReputation(payload.enrichment ?? null);
      } catch {
        if (active) setReputation(null);
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
    <article className="w-full rounded-xl bg-white p-4 shadow-lg shadow-slate-200/60 sm:p-6">
      <section className={`rounded-xl border px-4 py-4 ${trust.toneSoftBorder} ${trust.toneSoftBg}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-20 w-20 items-center justify-center rounded-full border-4 border-white text-xl font-bold ${trust.toneText}`}>
              {trustScore}%
            </div>
            <div>
              <p className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm font-semibold ${trust.toneSoftBorder} ${trust.toneSoftBg} ${trust.toneText}`}>
                <span aria-hidden>{trustIconGlyph(trust.icon)}</span>
                {trust.label}
              </p>
              <p className="mt-1 text-sm text-slate-700">Trust score: <span className="font-semibold">{trustScore}%</span></p>
              <p className="text-sm text-slate-700">Confidence: <span className="font-semibold capitalize">{scoreUi.confidence}</span></p>
            </div>
          </div>
          <div className="text-sm text-slate-700 sm:text-right">
            <p className="font-medium text-slate-900">Analyzed domain</p>
            <p className="mt-1 break-all">{result.domain}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-700">
          {trust.label === "Trusted"
            ? "Fraudly found mostly supportive signs in this snapshot."
            : `Fraudly flagged this website because ${(keyConcerns.slice(0, 3).join(" ").toLowerCase() || "multiple caution signals were detected")}.`}
        </p>
      </section>

      <section className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Why this score?</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {(consumer.why.length > 0 ? consumer.why : keyConcerns).slice(0, 5).map((item, idx) => (
            <li key={`${idx}-${item.slice(0, 32)}`}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Recommendation</p>
        <p className="mt-2 text-sm text-slate-700">{consumer.recommendation}</p>
      </section>

      <section className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Key concerns</p>
        {keyConcerns.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {keyConcerns.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <SignalList signals={split.concerns} empty="No major customer-facing concerns were detected." />
        )}
      </section>

      <section className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Positive signs</p>
        {positives.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {positives.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-600">No strong positive trust signals were confirmed.</p>
        )}
      </section>

      <section className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Checks we could not complete</p>
        <SignalList signals={split.unavailable} empty="All configured checks completed successfully." />
      </section>

      <details className="mt-5 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">Show technical details</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-700">
          <li>Domain age (days): {result.domainIntelligence.ageDays ?? "unknown"}</li>
          <li>Registration date: {result.domainIntelligence.registrationDate ?? "unknown"}</li>
          <li>Registrar: {result.domainIntelligence.registrar ?? "unknown"}</li>
          <li>TLS issuer: {result.ssl.certificateIssuer ?? "unknown"}</li>
          <li>TLS expiry: {result.ssl.certificateExpiry ?? "unknown"}</li>
          <li>HTTPS enabled: {result.ssl.httpsEnabled ? "yes" : "no"}</li>
          <li>AI used: {result.aiUsed ? "yes" : "no"}</li>
        </ul>
      </details>

      <details className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">Show source data</summary>
        <p className="mt-2 text-xs text-slate-600">Provider rows: {result.providerEvidence.length}</p>
        <SignalList signals={split.neutral} empty="No neutral technical source notes." />
      </details>

      <details className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">Show scoring/debug details</summary>
        <p className="mt-2 text-xs text-slate-600">Risk labels: {scoreUi.riskLabels.length > 0 ? scoreUi.riskLabels.join(" · ") : "none"}</p>
        <p className="mt-1 text-xs text-slate-600">Score evidence rows: {result.intelScoreBreakdown.length}</p>
        <p className="mt-1 text-xs text-slate-600">Reputation enrichment: {repLoading ? "loading" : reputation ? "available" : "unavailable"}</p>
        {reputation ? <ReviewSummary enrichment={reputation} /> : null}
      </details>
    </article>
  );
}
