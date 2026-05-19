"use client";

import type { BasicCheckResult } from "@/types/scam";
import { useResultFlow } from "@/components/i18n/useResultFlow";
import {
  humanRecGlyph,
  humanRecHeadline,
  humanRecHeadlineTone,
  resolveHumanRecKindForBasicCheck,
  shortExplainForBasic
} from "@/lib/scanResultDualLayer";
import { ResultSupportBox } from "@/components/ResultSupportBox";
import { trustScoreFromRisk } from "@/lib/scoring/displayScore";
import { getTrustColors } from "@/lib/scoring/trust-bands";
import { trustPresentationFromScore } from "@/lib/trustSystem";

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

export function BasicResultCard({ result }: { result: BasicCheckResult }) {
  const flow = useResultFlow();
  const trustStyle = trustScoreFromRisk(result.score);
  const trust = trustPresentationFromScore(trustStyle);
  const trustColors = getTrustColors(trustStyle);
  const humanKind = resolveHumanRecKindForBasicCheck(result.verdict, result.score);
  const humanHeadline = humanRecHeadline(humanKind, flow);
  const humanTone = humanRecHeadlineTone(humanKind, trustStyle);
  const shortEx = shortExplainForBasic(result.verdict, result.score, flow);
  const trustedVisitUrl = toSafeHttpUrl(`https://${result.domain}`);
  const showVisitWebsiteCta = trustStyle >= 85 && trust.level === "trusted" && Boolean(trustedVisitUrl);

  return (
    <article
      className={`w-full rounded-2xl border p-6 shadow-md sm:p-7 ${trustColors.border} ${trustColors.surfaceGradient}`}
    >
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{flow.basicResult.heading}</h2>
      </div>
      <p className="mt-2 text-sm text-slate-600">{flow.basicResult.intro}</p>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{flow.basicResult.checkedLink}</p>
        <p className="mt-1 break-all text-base font-semibold text-slate-900 sm:text-lg">{result.domain}</p>
      </div>

      <header className="mt-6 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-3xl ${trustColors.iconWrap} ${humanTone.icon}`}
            aria-hidden
          >
            {humanRecGlyph(humanKind)}
          </span>
          <h3 className={`text-balance text-2xl font-bold tracking-tight sm:text-3xl ${humanTone.text}`}>{humanHeadline}</h3>
        </div>
        <p className="text-base leading-relaxed text-slate-700">{shortEx}</p>
      </header>

      <section
        className={`mt-5 rounded-xl border px-4 py-3 ${trustColors.softBorder} ${trustColors.softBg}`}
        aria-label={`${flow.scanResult.technicalStatusHeading}: ${trust.label}`}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {flow.scanResult.technicalStatusHeading}
        </p>
        <p className={`mt-1 text-sm font-semibold ${trustColors.headlineText}`}>{trust.label}</p>
      </section>

      <section className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{flow.scanResult.trustScoreLabel}</p>
        <p className="mt-2">
          <span
            className={`inline-flex items-center rounded-xl border px-2.5 py-1 text-lg font-semibold tabular-nums ${trustColors.scorePill}`}
          >
            {trustStyle}
            <span className={`font-medium ${trustColors.scorePillDim}`}> / 100</span>
          </span>
        </p>
        <p className="mt-1 text-xs text-slate-500">{flow.scanResult.trustScoreExplainer}</p>
      </section>

      {showVisitWebsiteCta && trustedVisitUrl ? (
        <section className="mt-5 rounded-xl border border-slate-200 bg-white/70 px-4 py-3">
          <a
            href={trustedVisitUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 focus-visible:ring-offset-2"
          >
            {flow.checkPage.visitWebsiteCta}
            <span aria-hidden>↗</span>
          </a>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            {flow.checkPage.visitWebsiteDisclaimer}
          </p>
        </section>
      ) : null}

      <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-medium text-blue-900">{flow.basicResult.unlockHint}</p>
      </div>
      <ResultSupportBox className="mt-5" />
    </article>
  );
}
