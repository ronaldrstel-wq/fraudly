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
            {signal.confidence ? <span>Confidence: {signal.confidence}</span> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ResultCard({ result }: ResultCardProps) {
  const trustScore = Math.round(100 - result.score);
  const style = trustPresentationFromScore(trustScore);
  const { reviewSignals } = result;
  const hasPublicReviewData = reviewSignals.trustpilotFound || reviewSignals.googleFound;

  const keyRisks = result.trustSignals.filter((s) => s.type === "danger" || s.type === "warning");
  const supportiveSignals = result.trustSignals.filter((s) => s.type === "positive" || s.type === "info");
  const [reputation, setReputation] = useState<ReputationEnrichment | null>(null);
  const [repLoading, setRepLoading] = useState(false);
  const [repError, setRepError] = useState<string | null>(null);

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

      <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Key risk indicators</p>
        <p className="mt-1 text-xs text-slate-500">Warnings and higher-severity context from this run.</p>
        <SignalList
          signals={keyRisks}
          empty="No high-priority risk rows were raised by the configured intelligence checks."
        />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Trust signals</p>
        <p className="mt-1 text-xs text-slate-500">Supportive or informational context (including “no hit” messages).</p>
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
        <p className="text-sm font-semibold text-slate-900">Public reputation signals</p>
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
            {reputation.publicSignals?.warnings?.length ? (
              <ul className="list-disc space-y-1 pl-5 text-xs text-amber-800">
                {reputation.publicSignals.warnings.map((warning, i) => (
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
    </div>
  );
}
