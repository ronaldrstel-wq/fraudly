"use client";

import type { BasicCheckResult } from "@/types/scam";
import { EN_MESSAGES } from "@/lib/messages.en";
import { trustIconGlyph, trustPresentationFromScore } from "@/lib/trustSystem";

function verdictLabel(verdict: BasicCheckResult["verdict"]) {
  if (verdict === "safe") {
    return {
      label: EN_MESSAGES.basicResult.safeLabel,
      tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
      explanation: EN_MESSAGES.basicResult.safeExplanation
    };
  }
  if (verdict === "suspicious") {
    return {
      label: EN_MESSAGES.basicResult.suspiciousLabel,
      tone: "border-amber-200 bg-amber-50 text-amber-800",
      explanation: EN_MESSAGES.basicResult.suspiciousExplanation
    };
  }
  return {
    label: EN_MESSAGES.basicResult.highRiskLabel,
    tone: "border-rose-200 bg-rose-50 text-rose-800",
    explanation: EN_MESSAGES.basicResult.highRiskExplanation
  };
}

export function BasicResultCard({ result }: { result: BasicCheckResult }) {
  const verdict = verdictLabel(result.verdict);
  const trustStyle = Math.max(0, Math.min(100, Math.round(100 - result.score)));
  const trust = trustPresentationFromScore(trustStyle);

  return (
    <article className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-200/60 sm:p-7">
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{EN_MESSAGES.basicResult.heading}</h2>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        {EN_MESSAGES.basicResult.intro}
      </p>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{EN_MESSAGES.basicResult.checkedLink}</p>
        <p className="mt-1 break-all text-base font-semibold text-slate-900 sm:text-lg">{result.domain}</p>
      </div>

      <section className={`mt-5 rounded-xl border p-4 sm:p-5 ${verdict.tone}`}>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{EN_MESSAGES.basicResult.riskStatus}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{verdict.label}</p>
        <p className="mt-2 text-sm leading-relaxed opacity-90">{verdict.explanation}</p>
      </section>

      <section className={`mt-5 rounded-xl border p-4 ${trust.toneSoftBorder} ${trust.toneSoftBg}`}>
        <p className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${trust.toneSoftBorder} ${trust.toneSoftBg} ${trust.toneText}`}>
          <span aria-hidden>{trustIconGlyph(trust.icon)}</span>
          {trust.label}
        </p>
        <p className={`mt-2 text-sm font-semibold tabular-nums ${trust.toneText}`}>Trust score: {trustStyle}/100</p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/80">
          <div className={`h-full ${trust.progressBar}`} style={{ width: `${trustStyle}%` }} />
        </div>
      </section>

      <details className="mt-5 rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm">
        <summary className="cursor-pointer font-semibold text-slate-900">Show technical details</summary>
        <p className="mt-2 text-xs text-slate-600">Risk score: {result.score} · Verdict: {result.verdict}</p>
      </details>

      <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-medium text-blue-900">
          {EN_MESSAGES.basicResult.unlockHint}
        </p>
      </div>
    </article>
  );
}
