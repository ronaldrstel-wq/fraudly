"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { EN_MESSAGES } from "@/lib/messages.en";

export function ScamAlertsPageHeader() {
  const { locale, dict } = useLocale();
  const t = locale === "en" ? null : dict.scamAlerts;
  const en = EN_MESSAGES.scamAlertsUi;

  const eyebrow = t?.eyebrow ?? en.pageEyebrow;
  const title = t?.title ?? "Scam & phishing alerts";
  const intro = t?.intro ?? en.overviewIntro;
  const chips = t?.chips ?? [
    en.explainChipRecentlyDetected,
    en.explainChipTrendingDomains,
    en.explainChipPhishing,
    en.explainChipSuspiciousDomains
  ];
  const chipHint = t?.chipHint ?? en.chipHint;
  const disclaimer =
    t?.disclaimer ??
    "Fraudly aggregates third-party intelligence. Treat every alert as encouragement to verify—not as proof by itself.";

  return (
    <header className="max-w-3xl">
      <p className="text-sm font-medium text-blue-700">{eyebrow}</p>
      <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
      <p className="mt-3 max-w-prose text-pretty text-base leading-relaxed text-slate-600">{intro}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-700 sm:text-sm">
        {chips.map((chip) => (
          <span key={chip} className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
            {chip}
          </span>
        ))}
      </div>
      <p className="mt-3 max-w-prose text-pretty text-sm leading-relaxed text-slate-600">{chipHint}</p>
      <p className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700">
        {disclaimer}
      </p>
    </header>
  );
}
