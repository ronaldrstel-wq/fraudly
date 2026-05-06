"use client";

import type { BasicCheckResult } from "@/types/scam";
import { WatchlistToggle } from "@/components/WatchlistToggle";
import { EN_MESSAGES } from "@/lib/messages.en";

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
  const detailPath = `/check/${encodeURIComponent(result.domain)}`;

  return (
    <article className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-200/60 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{EN_MESSAGES.basicResult.heading}</h2>
        <WatchlistToggle
          itemType="domain"
          rawKey={result.domain}
          title={result.domain}
          detailPath={detailPath}
          trustScore={trustStyle}
          verdict={result.verdict}
          className="sm:max-w-[14rem]"
        />
      </div>
      <p className="mt-2 text-sm text-slate-600">
        {EN_MESSAGES.basicResult.intro}
      </p>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{EN_MESSAGES.basicResult.checkedLink}</p>
        <p className="mt-1 break-all text-base font-semibold text-slate-900 sm:text-lg">{result.domain}</p>
      </div>

      <div className={`mt-5 rounded-xl border p-4 sm:p-5 ${verdict.tone}`}>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{EN_MESSAGES.basicResult.riskStatus}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{verdict.label}</p>
        <p className="mt-2 text-sm leading-relaxed opacity-90">{verdict.explanation}</p>
      </div>

      <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-medium text-blue-900">
          {EN_MESSAGES.basicResult.unlockHint}
        </p>
      </div>
    </article>
  );
}
