"use client";

import type { BasicCheckResult } from "@/types/scam";
import { EN_MESSAGES } from "@/lib/messages.en";
import {
  humanRecGlyph,
  humanRecHeadline,
  humanRecHeadlineTone,
  resolveHumanRecKindForBasicCheck,
  shortExplainForBasic
} from "@/lib/scanResultDualLayer";
import { ResultSupportBox } from "@/components/ResultSupportBox";
import { trustPresentationFromScore } from "@/lib/trustSystem";

export function BasicResultCard({ result }: { result: BasicCheckResult }) {
  const trustStyle = Math.max(0, Math.min(100, Math.round(100 - result.score)));
  const trust = trustPresentationFromScore(trustStyle);
  const humanKind = resolveHumanRecKindForBasicCheck(result.verdict, result.score);
  const humanHeadline = humanRecHeadline(humanKind);
  const humanTone = humanRecHeadlineTone(humanKind);
  const shortEx = shortExplainForBasic(result.verdict, result.score);

  return (
    <article className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-200/60 sm:p-7">
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{EN_MESSAGES.basicResult.heading}</h2>
      </div>
      <p className="mt-2 text-sm text-slate-600">{EN_MESSAGES.basicResult.intro}</p>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{EN_MESSAGES.basicResult.checkedLink}</p>
        <p className="mt-1 break-all text-base font-semibold text-slate-900 sm:text-lg">{result.domain}</p>
      </div>

      <header className="mt-6 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`select-none text-3xl ${humanTone.icon}`} aria-hidden>
            {humanRecGlyph(humanKind)}
          </span>
          <h3 className={`text-balance text-2xl font-bold tracking-tight sm:text-3xl ${humanTone.text}`}>{humanHeadline}</h3>
        </div>
        <p className="text-base leading-relaxed text-slate-700">{shortEx}</p>
      </header>

      <section
        className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3"
        aria-label={`${EN_MESSAGES.scanResult.technicalStatusHeading}: ${trust.label}`}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {EN_MESSAGES.scanResult.technicalStatusHeading}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{trust.label}</p>
      </section>

      <section className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{EN_MESSAGES.scanResult.trustScoreLabel}</p>
        <p className="mt-1 text-lg font-medium tabular-nums text-slate-600">
          {trustStyle}
          <span className="text-slate-400"> / 100</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">{EN_MESSAGES.scanResult.trustScoreExplainer}</p>
      </section>

      <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-medium text-blue-900">{EN_MESSAGES.basicResult.unlockHint}</p>
      </div>
      <ResultSupportBox className="mt-5" />
    </article>
  );
}
